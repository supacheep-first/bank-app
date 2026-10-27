package config

import (
	"strings"
	"testing"
)

var required = map[string]string{
	"DB_HOST": "db", "DB_PORT": "3306", "DB_USER": "app",
	"DB_PASSWORD": "pw", "DB_NAME": "assignment", "JWT_SECRET": "s3cret",
}

func env(extra map[string]string, drop ...string) func(string) string {
	m := map[string]string{}
	for k, v := range required {
		m[k] = v
	}
	for k, v := range extra {
		m[k] = v
	}
	for _, k := range drop {
		delete(m, k)
	}
	return func(k string) string { return m[k] }
}

func TestLoad(t *testing.T) {
	defaults := Config{
		DBHost: "db", DBPort: "3306", DBUser: "app", DBPassword: "pw", DBName: "assignment",
		JWTSecret: "s3cret", Port: 8080, SessionTTLSeconds: 900, PinMaxAttempts: 4, PinLockSeconds: 60,
	}
	overridden := defaults
	overridden.Port, overridden.CookieSecure, overridden.SessionTTLSeconds = 9000, true, 30
	overridden.PinMaxAttempts, overridden.PinLockSeconds = 3, 120

	tests := []struct {
		name    string
		getenv  func(string) string
		want    Config
		wantErr string // substring; empty = no error
	}{
		{"only required -> defaults", env(nil), defaults, ""},
		{"empty optional (compose ${X:-}) -> defaults", env(map[string]string{
			"PORT": "", "COOKIE_SECURE": "", "SESSION_TTL_SECONDS": "", "PIN_MAX_ATTEMPTS": "", "PIN_LOCK_SECONDS": "",
		}), defaults, ""},
		{"invalid optional -> defaults", env(map[string]string{
			"PORT": "abc", "COOKIE_SECURE": "maybe", "SESSION_TTL_SECONDS": "-5", "PIN_MAX_ATTEMPTS": "0", "PIN_LOCK_SECONDS": "1.5",
		}), defaults, ""},
		{"port out of range -> default", env(map[string]string{"PORT": "70000"}), defaults, ""},
		{"pin attempts over tinyint -> default", env(map[string]string{"PIN_MAX_ATTEMPTS": "256"}), defaults, ""},
		{"valid optional overrides", env(map[string]string{
			"PORT": "9000", "COOKIE_SECURE": "true", "SESSION_TTL_SECONDS": "30", "PIN_MAX_ATTEMPTS": "3", "PIN_LOCK_SECONDS": "120",
		}), overridden, ""},
		{"one required missing", env(nil, "JWT_SECRET"), Config{}, "JWT_SECRET"},
		{"required empty counts as missing", env(map[string]string{"DB_HOST": ""}), Config{}, "DB_HOST"},
		{"all missing named together", func(string) string { return "" }, Config{}, "DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Load(tt.getenv)
			if tt.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
					t.Fatalf("err = %v, want containing %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if got != tt.want {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
		})
	}
}
