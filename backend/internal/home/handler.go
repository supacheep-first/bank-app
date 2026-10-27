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

// Accounts: GET /api/accounts -> 200 [account...] ordered by account_id (always an array) | 401 UNAUTHENTICATED
func (h Handler) Accounts(w http.ResponseWriter, r *http.Request) {
	rows, err := accountsByUser(r.Context(), h.DB, auth.UserID(r.Context()))
	if err != nil {
		httpx.WriteInternal(w, r, err)
		return
	}
	accounts := make([]account, len(rows)) // non-nil: no accounts is [] not null
	for i, row := range rows {
		accounts[i] = toAccount(row)
	}
	httpx.WriteJSON(w, http.StatusOK, accounts)
}

// Recent: GET /api/transactions/recent -> 200 [transaction...] newest ten by transaction_id (always an array) | 401 UNAUTHENTICATED
func (h Handler) Recent(w http.ResponseWriter, r *http.Request) {
	txns, err := recentByUser(r.Context(), h.DB, auth.UserID(r.Context()))
	if err != nil {
		httpx.WriteInternal(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, txns)
}

// Banners: GET /api/banners -> 200 [banner...] ordered by banner_id (always an array) | 401 UNAUTHENTICATED
func (h Handler) Banners(w http.ResponseWriter, r *http.Request) {
	banners, err := bannersByUser(r.Context(), h.DB, auth.UserID(r.Context()))
	if err != nil {
		httpx.WriteInternal(w, r, err)
		return
	}
	httpx.WriteJSON(w, http.StatusOK, banners)
}
