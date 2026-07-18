-- 0019_subco_invites.sql
-- Email-based invites to join a subco. The token stores the invited *email*
-- because the invitee may not be a `Users` row yet (mirror 0004_password_reset).

CREATE TABLE `Subco_Invites` (
  `Token`       varchar(36)  NOT NULL,
  `Subco`       int          NOT NULL,
  `Email`       varchar(255) NOT NULL,
  `CharacterId` int          DEFAULT NULL,
  `CreatedAt`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ExpiresAt`   datetime     NOT NULL,
  PRIMARY KEY (`Token`),
  KEY `si_subco_key` (`Subco`),
  KEY `si_character_key` (`CharacterId`),
  CONSTRAINT `si_subco_fk` FOREIGN KEY (`Subco`) REFERENCES `Subco` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `si_character_fk` FOREIGN KEY (`CharacterId`) REFERENCES `Characters` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
