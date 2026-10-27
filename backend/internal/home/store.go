package home

import (
	"context"
	"database/sql"
)

// user is the /api/user body. Both columns are nullable; a nil pointer is
// omitted from the JSON.
type user struct {
	Name     *string `json:"name,omitempty"`
	Greeting *string `json:"greetingMessage,omitempty"`
}

// userByID returns sql.ErrNoRows when users has no such row. LEFT JOIN: a user
// without a user_greetings row still gets a name.
func userByID(ctx context.Context, db *sql.DB, userID string) (user, error) {
	var u user
	err := db.QueryRowContext(ctx,
		`SELECT u.name, g.greeting FROM users u
		 LEFT JOIN user_greetings g ON g.user_id = u.user_id
		 WHERE u.user_id = ?`, userID,
	).Scan(&u.Name, &u.Greeting)
	return u, err
}
