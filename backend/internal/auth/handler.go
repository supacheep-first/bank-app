package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"backend/internal/config"
	"backend/internal/httpx"
)

type Handler struct {
	DB  *sql.DB
	Cfg config.Config
}

// Profile: GET /api/auth/profile?userId=… -> 200 {"name"} | 404 USER_NOT_FOUND
func (h Handler) Profile(w http.ResponseWriter, r *http.Request) {
	name, err := profileName(r.Context(), h.DB, r.URL.Query().Get("userId"))
	if errors.Is(err, sql.ErrNoRows) {
		httpx.WriteError(w, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
		return
	}
	if err != nil {
		httpx.WriteInternal(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, map[string]string{"name": name})
}

// SubmitPIN: POST /api/auth/pin {"userId","pin"} -> steps 1-5 of DECISIONS 15.
// 204 + session cookie | 400 VALIDATION_ERROR | 401 PIN_INVALID | 404 USER_NOT_FOUND | 429 PIN_LOCKED
func (h Handler) SubmitPIN(w http.ResponseWriter, r *http.Request) {
	now := time.Now().UTC().Truncate(time.Second) // the only clock read; datetime has no fraction

	// 1. pin must be 6 digits; a body that is not JSON of that shape fails the same way. No DB.
	var in struct {
		UserID string `json:"userId"`
		PIN    string `json:"pin"`
	}
	if json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&in) != nil || !validPIN(in.PIN) {
		httpx.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "PIN must be 6 digits", nil)
		return
	}

	// 2. unlocked read
	row, err := pinByUser(r.Context(), h.DB, in.UserID)
	if errors.Is(err, sql.ErrNoRows) {
		httpx.WriteError(w, http.StatusNotFound, "USER_NOT_FOUND", "User not found", nil)
		return
	}
	if err != nil {
		httpx.WriteInternal(w, r, err)
		return
	}

	// 3. already locked: no bcrypt, no count
	if row.State.LockedUntil.After(now) {
		writeLocked(w, retryAfter(row.State.LockedUntil, now))
		return
	}

	// 4. bcrypt outside the transaction so the row is not held for ~65 ms
	correct := true
	if err := bcrypt.CompareHashAndPassword([]byte(row.Hash), []byte(in.PIN)); err != nil {
		if !errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			httpx.WriteInternal(w, r, err)
			return
		}
		correct = false
	}

	// 5. count under FOR UPDATE
	limits := pinLimits{Max: h.Cfg.PinMaxAttempts, Lock: time.Duration(h.Cfg.PinLockSeconds) * time.Second}
	res, err := applyAttempt(r.Context(), h.DB, row.UserID, correct, now, limits)
	if err != nil {
		httpx.WriteInternal(w, r, err)
		return
	}
	switch res.Status {
	case http.StatusNoContent:
		c, err := sessionCookie(h.Cfg, row.UserID, now)
		if err != nil {
			httpx.WriteInternal(w, r, err)
			return
		}
		http.SetCookie(w, c)
		w.WriteHeader(http.StatusNoContent)
	case http.StatusUnauthorized:
		httpx.WriteError(w, http.StatusUnauthorized, "PIN_INVALID", "Invalid PIN", map[string]any{"attemptsLeft": res.AttemptsLeft})
	default:
		writeLocked(w, res.RetryAfterSec)
	}
}

func writeLocked(w http.ResponseWriter, sec int) {
	w.Header().Set("Retry-After", strconv.Itoa(sec))
	httpx.WriteError(w, http.StatusTooManyRequests, "PIN_LOCKED", "Too many attempts", map[string]any{"retryAfterSec": sec})
}

// sessionCookie issues the login cookie: JWT HS256 signed with JWTSecret,
// claims sub = userID and exp = now + SessionTTLSeconds (DECISIONS 12).
func sessionCookie(cfg config.Config, userID string, now time.Time) (*http.Cookie, error) {
	ttl := time.Duration(cfg.SessionTTLSeconds) * time.Second
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   userID,
		ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
	}).SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		return nil, err
	}
	return &http.Cookie{
		Name: "session", Value: token, Path: "/", MaxAge: cfg.SessionTTLSeconds,
		HttpOnly: true, SameSite: http.SameSiteStrictMode, Secure: cfg.CookieSecure,
	}, nil
}

type ctxKey struct{}

// UserID is the user id Require stored in ctx (the JWT sub, as spelled in the
// DB). Only meaningful inside a handler wrapped by Require.
func UserID(ctx context.Context) string {
	id, _ := ctx.Value(ctxKey{}).(string)
	return id
}

// Require guards the Main-page endpoints: a valid, unexpired session cookie
// puts the user id in the request context; anything else is 401 UNAUTHENTICATED
// (no cookie, bad signature, wrong alg, expired and missing exp/sub look the same).
func (h Handler) Require(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("session")
		var claims jwt.RegisteredClaims
		if err == nil {
			_, err = jwt.ParseWithClaims(c.Value, &claims,
				func(*jwt.Token) (any, error) { return []byte(h.Cfg.JWTSecret), nil },
				jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired())
		}
		if err != nil || claims.Subject == "" {
			httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Not signed in", nil)
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), ctxKey{}, claims.Subject)))
	}
}
