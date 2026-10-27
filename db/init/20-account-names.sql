CREATE TABLE `account_names` (
  `account_id` varchar(50)  NOT NULL,
  `name`       varchar(100) NOT NULL,
  PRIMARY KEY (`account_id`),
  CONSTRAINT `fk_account_names_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
