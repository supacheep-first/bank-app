-- The WHERE of each search that the 5 indexes serve, plus users by PK as the
-- control. Only the WHERE matters to the index, so these are not the full
-- queries of backend/internal/home/store.go. bench.sh reads the `rows` column
-- and tells the queries apart by the `table` column: one table per statement.
USE assignment;
EXPLAIN SELECT * FROM users WHERE user_id = 'clare';
EXPLAIN SELECT * FROM accounts WHERE user_id = 'clare';
EXPLAIN SELECT * FROM account_flags WHERE account_id = 'clare-acc-5';
EXPLAIN SELECT * FROM transactions WHERE user_id = 'clare';
EXPLAIN SELECT * FROM debit_cards WHERE user_id = 'clare';
EXPLAIN SELECT * FROM banners WHERE user_id = 'clare';
