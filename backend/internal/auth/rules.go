package auth

import (
	"regexp"
	"time"
)

// pinState mirrors user_pins; a zero LockedUntil is NULL.
type pinState struct {
	Failed      int
	LockedUntil time.Time
}

type pinLimits struct {
	Max  int
	Lock time.Duration
}

// pinResult is Status 204 | 401 (AttemptsLeft) | 429 (RetryAfterSec).
type pinResult struct {
	Status        int
	AttemptsLeft  int
	RetryAfterSec int
}

// Go's $ without the m flag is end of text, so "123456\n" does not match.
var pinRE = regexp.MustCompile(`^[0-9]{6}$`)

// validPIN: exactly six ASCII digits.
func validPIN(s string) bool { return pinRE.MatchString(s) }

// nextAttempt applies one PIN attempt. While locked nothing changes, even for
// a correct PIN. An expired lock restarts the count from 0 (failed_attempts is
// still at its old max in the row).
func nextAttempt(s pinState, correct bool, now time.Time, l pinLimits) (pinState, pinResult) {
	if s.LockedUntil.After(now) {
		return s, pinResult{Status: 429, RetryAfterSec: retryAfter(s.LockedUntil, now)}
	}
	if correct {
		return pinState{}, pinResult{Status: 204}
	}
	n := 1
	if s.LockedUntil.IsZero() {
		n = s.Failed + 1
	}
	if n >= l.Max {
		until := now.Add(l.Lock)
		return pinState{Failed: n, LockedUntil: until}, pinResult{Status: 429, RetryAfterSec: retryAfter(until, now)}
	}
	return pinState{Failed: n}, pinResult{Status: 401, AttemptsLeft: l.Max - n}
}

// retryAfter is the whole seconds left until lockedUntil, rounded up.
func retryAfter(lockedUntil, now time.Time) int {
	return max(0, int((lockedUntil.Sub(now)+time.Second-1)/time.Second))
}
