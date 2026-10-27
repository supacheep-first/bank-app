package home

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"
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

// accountRow is one accounts row as stored: every column nullable, Flags holds
// all of the account's flag_value in flag_id order. Filtering is toAccount's job.
type accountRow struct {
	Type, Currency, Number, Issuer, Color, Name *string
	Amount                                      *json.Number // DECIMAL text as-is, never a float
	Main                                        *bool
	Progress                                    *int
	Flags                                       []string
}

// accountsByUser: one query. The flags subquery runs per account through
// idx_account_flags_account_id (the table has no index on user_id and 6M rows).
// GROUP_CONCAT is capped at 1024 bytes; flag_value is varchar(30) and the data
// has at most 2 flags per account.
func accountsByUser(ctx context.Context, db *sql.DB, userID string) ([]accountRow, error) {
	rows, err := db.QueryContext(ctx,
		`SELECT a.type, b.amount, a.currency, a.account_number, a.issuer, d.color, d.is_main_account, d.progress, n.name,
		        (SELECT GROUP_CONCAT(f.flag_value ORDER BY f.flag_id) FROM account_flags f WHERE f.account_id = a.account_id)
		 FROM accounts a
		 LEFT JOIN account_details d ON d.account_id = a.account_id
		 LEFT JOIN account_balances b ON b.account_id = a.account_id
		 LEFT JOIN account_names n ON n.account_id = a.account_id
		 WHERE a.user_id = ?
		 ORDER BY a.account_id`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []accountRow
	for rows.Next() {
		var r accountRow
		var flags *string
		if err := rows.Scan(&r.Type, &r.Amount, &r.Currency, &r.Number, &r.Issuer, &r.Color, &r.Main, &r.Progress, &r.Name, &flags); err != nil {
			return nil, err
		}
		if flags != nil {
			r.Flags = strings.Split(*flags, ",")
		}
		out = append(out, r)
	}
	return out, rows.Err()
}
