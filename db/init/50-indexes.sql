USE assignment;

CREATE INDEX idx_accounts_user_id ON accounts (user_id);
CREATE INDEX idx_account_flags_account_id ON account_flags (account_id);
CREATE INDEX idx_transactions_user_id ON transactions (user_id);
CREATE INDEX idx_debit_cards_user_id ON debit_cards (user_id);
CREATE INDEX idx_banners_user_id ON banners (user_id);
