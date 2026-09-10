DROP TABLE IF EXISTS Event_Character_Budget;

CREATE TABLE `Event_Coupons` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Event` int NOT NULL,
  `User` int NOT NULL,
  `Code` varchar(64) NOT NULL,
  `Type` ENUM('budget') NOT NULL DEFAULT 'budget',
  `Value` int NOT NULL DEFAULT 0,
  `RedeemedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `ec_code` (`Code`),
  KEY `ec_event_user` (`Event`, `User`),
  CONSTRAINT `ec_event` FOREIGN KEY (`Event`) REFERENCES `Events`(`Id`),
  CONSTRAINT `ec_user` FOREIGN KEY (`User`) REFERENCES `Users`(`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
