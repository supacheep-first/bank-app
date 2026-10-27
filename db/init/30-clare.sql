INSERT INTO `users` (`user_id`, `name`) VALUES ('clare', 'Clare');

INSERT INTO `user_greetings` (`user_id`, `greeting`) VALUES ('clare', 'Have a nice day Clare');

INSERT INTO `accounts` (`account_id`, `user_id`, `type`, `currency`, `account_number`, `issuer`) VALUES
('clare-acc-1', 'clare', 'saving-account',      'THB', '568-2-81740-9', 'TestLab'),
('clare-acc-2', 'clare', 'saving-account',      'THB', '568-2-81741-7', 'TestLab'),
('clare-acc-3', 'clare', 'credit-loan',         'THB', '568-2-81742-5', 'TestLab'),
('clare-acc-4', 'clare', 'goal-saving-account', 'THB', '568-2-81743-3', 'TestLab'),
('clare-acc-5', 'clare', 'credit-loan',         'THB', '568-2-81744-1', 'TestLab');

INSERT INTO `account_balances` (`account_id`, `user_id`, `amount`) VALUES
('clare-acc-1', 'clare',   62000.00),
('clare-acc-2', 'clare', 8837999.00),
('clare-acc-3', 'clare',     300.10),
('clare-acc-4', 'clare',   30000.00),
('clare-acc-5', 'clare',   30000.00);

INSERT INTO `account_details` (`account_id`, `user_id`, `color`, `is_main_account`, `progress`) VALUES
('clare-acc-1', 'clare', '#24c875', 1, NULL),
('clare-acc-2', 'clare', '#15bbc7', 0, NULL),
('clare-acc-3', 'clare', '#f88355', 0, NULL),
('clare-acc-4', 'clare', '#9366ed', 0, 24),
('clare-acc-5', 'clare', '#557bf2', 0, NULL);

INSERT INTO `account_names` (`account_id`, `name`) VALUES
('clare-acc-4', 'Travel New York'),
('clare-acc-5', 'Need to repay');

INSERT INTO `account_flags` (`account_id`, `user_id`, `flag_type`, `flag_value`) VALUES
('clare-acc-5', 'clare', 'system', 'Disbursement'),
('clare-acc-5', 'clare', 'system', 'Overdue');

INSERT INTO `debit_cards` (`card_id`, `user_id`, `name`) VALUES
('clare-card-1', 'clare', 'My Salary'),
('clare-card-2', 'clare', 'For My Dream'),
('clare-card-3', 'clare', 'My Debit card');

INSERT INTO `debit_card_status` (`card_id`, `user_id`, `status`) VALUES
('clare-card-1', 'clare', 'in-progress'),
('clare-card-2', 'clare', 'in-progress'),
('clare-card-3', 'clare', 'Active');

INSERT INTO `debit_card_design` (`card_id`, `user_id`, `color`, `border_color`) VALUES
('clare-card-1', 'clare', '#00a1e2', NULL),
('clare-card-2', 'clare', '#ff8300', NULL),
('clare-card-3', 'clare', '#ffffff', '#f2f3f7');

INSERT INTO `debit_card_details` (`card_id`, `user_id`, `issuer`, `number`) VALUES
('clare-card-1', 'clare', 'TestLab', NULL),
('clare-card-2', 'clare', 'TestLab', NULL),
('clare-card-3', 'clare', 'TestLab', '9440 7841 2222 3115');

INSERT INTO `transactions` (`transaction_id`, `user_id`, `name`, `image`, `isBank`) VALUES
('clare-txn-01', 'clare', 'MarkYu Gonzales', 'https://dummyimage.com/54x54/999/fff', 1),
('clare-txn-02', 'clare', 'Emily',           'https://dummyimage.com/54x54/999/fff', 0),
('clare-txn-03', 'clare', 'Emily',           'https://dummyimage.com/54x54/999/fff', 0),
('clare-txn-04', 'clare', 'Jone Kiersten',   'https://dummyimage.com/54x54/999/fff', 0),
('clare-txn-05', 'clare', 'AbcdEfghiJKlmN',  'https://dummyimage.com/54x54/999/fff', 1),
('clare-txn-06', 'clare', 'Emily',           'https://dummyimage.com/54x54/999/fff', 0);

INSERT INTO `banners` (`banner_id`, `user_id`, `title`, `description`, `image`) VALUES
('clare-banner-1', 'clare', 'Want some money?', 'You can start apply ''Clare''', 'https://dummyimage.com/54x54/999/fff');
