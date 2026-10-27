package config

import (
	"fmt"
	"strconv"
	"strings"
)

type Config struct {
	DBHost, DBPort, DBUser, DBPassword, DBName string
	JWTSecret                                  string
	Port                                       int
	CookieSecure                               bool
	SessionTTLSeconds                          int
	PinMaxAttempts                             int
	PinLockSeconds                             int
}

// Load reads env through getenv. Missing required values are an error naming
// all of them; invalid or empty optional values silently fall back to defaults.
func Load(getenv func(string) string) (Config, error) {
	var missing []string
	req := func(k string) string {
		v := getenv(k)
		if v == "" {
			missing = append(missing, k)
		}
		return v
	}
	c := Config{
		DBHost:     req("DB_HOST"),
		DBPort:     req("DB_PORT"),
		DBUser:     req("DB_USER"),
		DBPassword: req("DB_PASSWORD"),
		DBName:     req("DB_NAME"),
		JWTSecret:  req("JWT_SECRET"),
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing required env: %s", strings.Join(missing, ", "))
	}

	c.Port = positive(getenv("PORT"), 8080)
	if c.Port > 65535 {
		c.Port = 8080
	}
	c.CookieSecure, _ = strconv.ParseBool(getenv("COOKIE_SECURE")) // invalid -> false
	c.SessionTTLSeconds = positive(getenv("SESSION_TTL_SECONDS"), 900)
	c.PinMaxAttempts = positive(getenv("PIN_MAX_ATTEMPTS"), 4)
	if c.PinMaxAttempts > 255 { // user_pins.failed_attempts is tinyint unsigned
		c.PinMaxAttempts = 4
	}
	c.PinLockSeconds = positive(getenv("PIN_LOCK_SECONDS"), 60)
	return c, nil
}

func positive(s string, def int) int {
	if n, err := strconv.Atoi(s); err == nil && n > 0 {
		return n
	}
	return def
}
