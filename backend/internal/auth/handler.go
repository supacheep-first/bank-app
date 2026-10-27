package auth

import (
	"database/sql"
	"errors"
	"net/http"

	"backend/internal/httpx"
)

type Handler struct {
	DB *sql.DB
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
