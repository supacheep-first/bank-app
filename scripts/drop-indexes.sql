-- State "before": drop the 5 indexes of db/init/50-indexes.sql on the running DB.
-- Restore with db/init/50-indexes.sql (see README, Performance).
USE assignment;
DROP INDEX idx_accounts_user_id ON accounts;
DROP INDEX idx_account_flags_account_id ON account_flags;
DROP INDEX idx_transactions_user_id ON transactions;
DROP INDEX idx_debit_cards_user_id ON debit_cards;
DROP INDEX idx_banners_user_id ON banners;
