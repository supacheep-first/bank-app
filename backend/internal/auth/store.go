package auth

import (
	"context"
	"database/sql"
)

// profileName returns sql.ErrNoRows when the user does not exist. user_id is
// utf8mb4_0900_ai_ci, so "Clare" matches the row "clare". name is nullable:
// a user without a name comes back as "".
func profileName(ctx context.Context, db *sql.DB, userID string) (string, error) {
	var name sql.NullString
	err := db.QueryRowContext(ctx, "SELECT name FROM users WHERE user_id = ?", userID).Scan(&name)
	return name.String, err
}
