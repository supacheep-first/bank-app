package auth

import (
	"context"
	"database/sql"
	"time"
)

// profileName returns sql.ErrNoRows when the user does not exist. user_id is
// utf8mb4_0900_ai_ci, so "Clare" matches the row "clare". name is nullable:
// a user without a name comes back as "".
func profileName(ctx context.Context, db *sql.DB, userID string) (string, error) {
	var name sql.NullString
	err := db.QueryRowContext(ctx, "SELECT name FROM users WHERE user_id = ?", userID).Scan(&name)
	return name.String, err
}

// pinRow is the unlocked read (step 2). UserID is the canonical spelling from
// the row: collation ai_ci lets "Clare" match "clare", and the JWT sub and the
// later queries use the stored one.
type pinRow struct {
	UserID, Hash string
	State        pinState
}

// pinByUser returns sql.ErrNoRows when the user does not exist.
func pinByUser(ctx context.Context, db *sql.DB, userID string) (pinRow, error) {
	var p pinRow
	var lu sql.NullTime
	err := db.QueryRowContext(ctx,
		"SELECT user_id, pin_hash, failed_attempts, locked_until FROM user_pins WHERE user_id = ?", userID,
	).Scan(&p.UserID, &p.Hash, &p.State.Failed, &lu)
	p.State.LockedUntil = lu.Time // zero when NULL
	return p, err
}

// applyAttempt is step 5: re-read the row under FOR UPDATE so concurrent
// requests count one at a time, apply nextAttempt, write back only if it changed.
func applyAttempt(ctx context.Context, db *sql.DB, userID string, correct bool, now time.Time, l pinLimits) (pinResult, error) {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return pinResult{}, err
	}
	defer tx.Rollback() // no-op after Commit

	var s pinState
	var lu sql.NullTime
	err = tx.QueryRowContext(ctx,
		"SELECT failed_attempts, locked_until FROM user_pins WHERE user_id = ? FOR UPDATE", userID,
	).Scan(&s.Failed, &lu)
	if err != nil {
		return pinResult{}, err
	}
	s.LockedUntil = lu.Time

	next, res := nextAttempt(s, correct, now, l)
	if next.Failed != s.Failed || !next.LockedUntil.Equal(s.LockedUntil) {
		_, err = tx.ExecContext(ctx, "UPDATE user_pins SET failed_attempts = ?, locked_until = ? WHERE user_id = ?",
			next.Failed, sql.NullTime{Time: next.LockedUntil, Valid: !next.LockedUntil.IsZero()}, userID)
		if err != nil {
			return pinResult{}, err
		}
	}
	return res, tx.Commit()
}
