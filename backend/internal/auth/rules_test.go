package auth

import (
	"testing"
	"time"
)

func TestValidPIN(t *testing.T) {
	for pin, want := range map[string]bool{
		"135795": true, "000000": true,
		"": false, "12345": false, "1234567": false, "12a456": false, "12345 ": false, "１３５７９５": false, // fullwidth digits
	} {
		if got := validPIN(pin); got != want {
			t.Errorf("validPIN(%q) = %v, want %v", pin, got, want)
		}
	}
}

func TestNextAttempt(t *testing.T) {
	now := time.Date(2026, 10, 27, 8, 0, 0, 0, time.UTC)
	l := pinLimits{Max: 4, Lock: 60 * time.Second}
	locked := pinState{Failed: 4, LockedUntil: now.Add(30 * time.Second)}
	expired := pinState{Failed: 4, LockedUntil: now.Add(-time.Second)}

	for _, c := range []struct {
		name    string
		in      pinState
		correct bool
		limits  pinLimits
		want    pinState
		res     pinResult
	}{
		{"first wrong", pinState{}, false, l, pinState{Failed: 1}, pinResult{Status: 401, AttemptsLeft: 3}},
		{"second wrong", pinState{Failed: 1}, false, l, pinState{Failed: 2}, pinResult{Status: 401, AttemptsLeft: 2}},
		{"third wrong", pinState{Failed: 2}, false, l, pinState{Failed: 3}, pinResult{Status: 401, AttemptsLeft: 1}},
		{"fourth wrong locks", pinState{Failed: 3}, false, l,
			pinState{Failed: 4, LockedUntil: now.Add(60 * time.Second)}, pinResult{Status: 429, RetryAfterSec: 60}},
		{"max 1 locks at once", pinState{}, false, pinLimits{Max: 1, Lock: 5 * time.Second},
			pinState{Failed: 1, LockedUntil: now.Add(5 * time.Second)}, pinResult{Status: 429, RetryAfterSec: 5}},
		{"correct resets", pinState{Failed: 3}, true, l, pinState{}, pinResult{Status: 204}},
		{"correct on clean state", pinState{}, true, l, pinState{}, pinResult{Status: 204}},
		{"wrong while locked is not counted", locked, false, l, locked, pinResult{Status: 429, RetryAfterSec: 30}},
		{"correct while locked is refused", locked, true, l, locked, pinResult{Status: 429, RetryAfterSec: 30}},
		{"lock ends exactly now", pinState{Failed: 4, LockedUntil: now}, true, l, pinState{}, pinResult{Status: 204}},
		{"wrong after lock expired restarts count", expired, false, l, pinState{Failed: 1}, pinResult{Status: 401, AttemptsLeft: 3}},
		{"correct after lock expired", expired, true, l, pinState{}, pinResult{Status: 204}},
	} {
		t.Run(c.name, func(t *testing.T) {
			got, res := nextAttempt(c.in, c.correct, now, c.limits)
			if !got.LockedUntil.Equal(c.want.LockedUntil) || got.Failed != c.want.Failed || res != c.res {
				t.Errorf("got %+v %+v, want %+v %+v", got, res, c.want, c.res)
			}
		})
	}
}

func TestRetryAfter(t *testing.T) {
	now := time.Date(2026, 10, 27, 8, 0, 0, 0, time.UTC)
	for _, c := range []struct {
		until time.Duration
		want  int
	}{
		{60 * time.Second, 60}, {59*time.Second + time.Millisecond, 60}, {time.Nanosecond, 1}, {0, 0}, {-5 * time.Second, 0},
	} {
		if got := retryAfter(now.Add(c.until), now); got != c.want {
			t.Errorf("retryAfter(now+%v) = %d, want %d", c.until, got, c.want)
		}
	}
}
