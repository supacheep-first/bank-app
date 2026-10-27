CREATE TABLE `user_pins` (
  `user_id`         varchar(50)      NOT NULL,
  `pin_hash`        char(60)         NOT NULL,
  `failed_attempts` tinyint unsigned NOT NULL DEFAULT 0,
  `locked_until`    datetime         DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_pins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `user_pins` (`user_id`, `pin_hash`)
SELECT `user_id`, '$2y$10$pzoEtdzoUiThHdLpgj9Su.z7br3aT0B3G9Fv2sscpH9kMfLsvBmrK' FROM `users`;
