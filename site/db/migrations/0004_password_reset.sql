CREATE TABLE `Password_Reset_Tokens` (
  `Token`     varchar(255) NOT NULL,
  `UserId`    int          NOT NULL,
  `CreatedAt` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ExpiresAt` datetime     NOT NULL,
  PRIMARY KEY (`Token`),
  KEY `prt_user_key` (`UserId`),
  CONSTRAINT `prt_user_fk` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Email_Templates` (`Key`, `DocUrl`) VALUES
  ('password_reset', 'https://docs.google.com/document/d/1rQMErsWOTvYeAQgil7QLljIQzKl3r6Bg129SVZKTQwE/edit?usp=sharing');
