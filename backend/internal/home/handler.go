package home

import (
	"database/sql"
	"errors"
	"net/http"

	"backend/internal/auth"
	"backend/internal/httpx"
)

type Handler struct {
	DB *sql.DB
}

// User: GET /api/user -> 200 {"name","greetingMessage"} (a NULL field is left out) | 401 UNAUTHENTICATED
func (h Handler) User(w http.ResponseWriter, r *http.Request) {
	u, err := userByID(r.Context(), h.DB, auth.UserID(r.Context()))
	if errors.Is(err, sql.ErrNoRows) {
		// valid JWT for a user that no longer exists: same as not signed in
		httpx.WriteError(w, http.StatusUnauthorized, "UNAUTHENTICATED", "Not signed in", nil)
		return
	}
	if err != nil {
		httpx.WriteInternal(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, u)
}
