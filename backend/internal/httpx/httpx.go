package httpx

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"
)

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// WriteError writes {"error":{"code","message", ...extra}}. extra carries the
// per-error fields (attemptsLeft, retryAfterSec); pass nil when there are none.
func WriteError(w http.ResponseWriter, status int, code, message string, extra map[string]any) {
	body := map[string]any{}
	for k, v := range extra {
		body[k] = v
	}
	body["code"], body["message"] = code, message
	WriteJSON(w, status, map[string]any{"error": body})
}

// WriteInternal logs err server-side and sends only INTERNAL_ERROR to the client.
func WriteInternal(w http.ResponseWriter, r *http.Request, err error) {
	slog.Error("internal error", "method", r.Method, "path", r.URL.Path, "err", err)
	WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// Log writes one slog line per request.
func Log(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		slog.Info("request", "method", r.Method, "path", r.URL.Path, "status", rec.status, "duration", time.Since(start))
	})
}
