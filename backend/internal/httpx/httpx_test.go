package httpx

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWriteError(t *testing.T) {
	w := httptest.NewRecorder()
	WriteError(w, http.StatusUnauthorized, "PIN_INVALID", "Wrong PIN", map[string]any{"attemptsLeft": 3})
	want := `{"error":{"attemptsLeft":3,"code":"PIN_INVALID","message":"Wrong PIN"}}`
	if got := strings.TrimSpace(w.Body.String()); w.Code != 401 || got != want {
		t.Errorf("got %d %s, want 401 %s", w.Code, got, want)
	}
}

func TestWriteInternalHidesDetail(t *testing.T) {
	w := httptest.NewRecorder()
	WriteInternal(w, httptest.NewRequest("GET", "/x", nil), errors.New("dial tcp 10.0.0.1: secret detail"))
	if w.Code != 500 || strings.Contains(w.Body.String(), "secret") || !strings.Contains(w.Body.String(), `"INTERNAL_ERROR"`) {
		t.Errorf("got %d %s", w.Code, w.Body.String())
	}
}
