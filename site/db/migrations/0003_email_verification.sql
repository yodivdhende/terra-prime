ALTER TABLE `Users`
  ADD COLUMN `Verified` TINYINT(1) NOT NULL DEFAULT 0;

UPDATE `Users` SET `Verified` = 1;

CREATE TABLE `Email_Templates` (
  `Id`     int           NOT NULL AUTO_INCREMENT,
  `Key`    varchar(64)   NOT NULL,
  `DocUrl` varchar(2048) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `et_key_unique` (`Key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Email_Verification_Tokens` (
  `Token`     varchar(255) NOT NULL,
  `UserId`    int          NOT NULL,
  `CreatedAt` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ExpiresAt` datetime     NOT NULL,
  PRIMARY KEY (`Token`),
  KEY `evt_user_key` (`UserId`),
  CONSTRAINT `evt_user_fk` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `Email_Templates` (`Key`, `DocUrl`) VALUES
  ('verify_email', 'https://docs.google.com/document/d/1OKVxCxIyNfzP-j5BrIx_59g4uXNuBjVpk9QN0pUkK2A/edit?usp=sharing');
