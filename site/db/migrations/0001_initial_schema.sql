SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE TABLE `Admins` (
  `UserId` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Characters` (
  `Id` int NOT NULL,
  `Name` varchar(254) DEFAULT NULL,
  `Owner` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Character_Versions` (
  `Id` int NOT NULL,
  `Character` int NOT NULL,
  `Name` varchar(254) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Character_Version_Implants` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CharacterVersion` int DEFAULT NULL,
  `Implant` int DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Character_Version_Items` (
  `Id` int NOT NULL,
  `CharacterVersion` int DEFAULT NULL,
  `Item` int DEFAULT NULL,
  `Count` int DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Character_Version_Skills` (
  `Id` int NOT NULL,
  `CharacterVersion` int DEFAULT NULL,
  `Skill` int DEFAULT NULL,
  `Value` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Events` (
  `Id` int NOT NULL,
  `Name` varchar(254) DEFAULT NULL,
  `StartTime` datetime DEFAULT NULL,
  `EndTime` datetime DEFAULT NULL,
  `Status` ENUM('Draft','Open', 'Live', 'Canceled') DEFAULT 'Draft',
  `Budget` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Event_Participants` (
  `Event` int NOT NULL,
  `User` int NOT NULL,
  `CharacterVersion` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Event_Character_Budget` (
  `Event`          int NOT NULL,
  `Character`      int NOT NULL,
  `BudgetIncrease` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Event`, `Character`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Event_Character_Discounts_Items` (
  `Event`     int NOT NULL,
  `Character` int NOT NULL,
  `Item`      int NOT NULL,
  `Discount`  int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Event`, `Character`, `Item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Event_Character_Discounts_Implants` (
  `Event`     int NOT NULL,
  `Character` int NOT NULL,
  `Implant`   int NOT NULL,
  `Discount`  int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Event`, `Character`, `Implant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Event_Character_Discounts_Skills` (
  `Event`     int NOT NULL,
  `Character` int NOT NULL,
  `Skill`     int NOT NULL,
  `Discount`  int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Event`, `Character`, `Skill`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Implants` (
  `Id` int NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Description` text NOT NULL,
  `Cost` int NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Items` (
  `Id` int NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Description` text NOT NULL,
  `Cost` int NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Messages` (
  `Id` int NOT NULL,
  `Sender` int DEFAULT NULL,
  `Recipient` int NOT NULL,
  `Subject` varchar(512) NOT NULL,
  `Message` text NOT NULL,
  `Attachment` json NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Party` (
  `Id` int NOT NULL,
  `Name` varchar(254) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Party_Members` (
  `Party` int NOT NULL,
  `Member` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Sessions` (
  `Token` varchar(255) NOT NULL,
  `UserId` int DEFAULT NULL,
  `Description` varchar(500) DEFAULT NULL,
  `Start` datetime NOT NULL,
  `End` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Session_Roles` (
  `Token` varchar(255) NOT NULL,
  `Role` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Skills` (
  `Id` int NOT NULL,
  `Group` int DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Description` text,
  `Cost` int NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Skill_Groups` (
  `Id` int NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Description` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Users` (
  `Id` int NOT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `Admins`
  ADD PRIMARY KEY (`UserId`);

ALTER TABLE `Characters`
  ADD PRIMARY KEY (`Id`),
  ADD KEY `Owner` (`Owner`);

ALTER TABLE `Character_Versions`
  ADD PRIMARY KEY (`Id`),
  ADD KEY `Character` (`Character`);

ALTER TABLE `Character_Version_Implants`
  ADD KEY `CharacterVersion` (`CharacterVersion`),
  ADD KEY `Implant` (`Implant`);

ALTER TABLE `Character_Version_Items`
  ADD PRIMARY KEY (`Id`),
  ADD KEY `CharacterVersion` (`CharacterVersion`),
  ADD KEY `Item` (`Item`);

ALTER TABLE `Character_Version_Skills`
  ADD PRIMARY KEY (`Id`),
  ADD KEY `CharacterVersion` (`CharacterVersion`),
  ADD KEY `Skill` (`Skill`);

ALTER TABLE `Events`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Event_Participants`
  ADD PRIMARY KEY (`Event`,`User`),
  ADD KEY `User` (`User`);

ALTER TABLE `Implants`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Items`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Messages`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Party`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Party_Members`
  ADD PRIMARY KEY (`Party`,`Member`),
  ADD KEY `Member` (`Member`);

ALTER TABLE `Sessions`
  ADD PRIMARY KEY (`Token`);

ALTER TABLE `Session_Roles`
  ADD PRIMARY KEY (`Token`,`Role`);

ALTER TABLE `Skills`
  ADD PRIMARY KEY (`Id`),
  ADD KEY `Group` (`Group`);

ALTER TABLE `Skill_Groups`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Users`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Characters`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `Character_Versions`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `Character_Version_Items`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `Character_Version_Skills`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

ALTER TABLE `Events`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

ALTER TABLE `Implants`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `Items`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `Messages`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `Party`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `Skills`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `Skill_Groups`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `Users`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `Admins`
  ADD CONSTRAINT `Admins_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`);

ALTER TABLE `Characters`
  ADD CONSTRAINT `Characters_ibfk_1` FOREIGN KEY (`Owner`) REFERENCES `Users` (`Id`);

ALTER TABLE `Character_Versions`
  ADD CONSTRAINT `Character_Versions_Characters` FOREIGN KEY (`Character`) REFERENCES `Characters` (`Id`);

ALTER TABLE `Character_Version_Skills`
  ADD CONSTRAINT `Character_Version_Skills_ibfk_1` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions` (`Id`);

ALTER TABLE `Character_Version_Items`
  ADD CONSTRAINT `Character_Version_Items_ibfk_1` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions` (`Id`),
  ADD CONSTRAINT `Character_Version_Items_ibfk_2` FOREIGN KEY (`Item`)             REFERENCES `Items` (`Id`);

ALTER TABLE `Character_Version_Implants`
  ADD CONSTRAINT `Character_Version_Implants_ibfk_1` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions` (`Id`),
  ADD CONSTRAINT `Character_Version_Implants_ibfk_2` FOREIGN KEY (`Implant`)          REFERENCES `Implants` (`Id`);

ALTER TABLE `Event_Participants`
  ADD CONSTRAINT `Event_Participants_ibfk_1` FOREIGN KEY (`Event`)            REFERENCES `Events` (`Id`),
  ADD CONSTRAINT `Event_Participants_ibfk_2` FOREIGN KEY (`User`)             REFERENCES `Users` (`Id`),
  ADD CONSTRAINT `Event_Participants_ibfk_3` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions` (`Id`);

ALTER TABLE `Party_Members`
  ADD CONSTRAINT `Party_Members_ibfk_1` FOREIGN KEY (`Party`) REFERENCES `Party` (`Id`),
  ADD CONSTRAINT `Party_Members_ibfk_2` FOREIGN KEY (`Member`) REFERENCES `Characters` (`Id`);

ALTER TABLE `Sessions`
  ADD CONSTRAINT `Sessions_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`);

ALTER TABLE `Session_Roles`
  ADD CONSTRAINT `Session_Roles_ibfk_1` FOREIGN KEY (`Token`) REFERENCES `Sessions` (`Token`);

ALTER TABLE `Messages`
  ADD CONSTRAINT `Messages_ibfk_1` FOREIGN KEY (`Sender`)    REFERENCES `Users` (`Id`),
  ADD CONSTRAINT `Messages_ibfk_2` FOREIGN KEY (`Recipient`) REFERENCES `Users` (`Id`);

ALTER TABLE `Skills`
  ADD CONSTRAINT `Skills_ibfk_1` FOREIGN KEY (`Group`) REFERENCES `Skill_Groups` (`Id`);

ALTER TABLE `Event_Character_Budget`
  ADD CONSTRAINT `ecb_event`     FOREIGN KEY (`Event`)     REFERENCES `Events` (`Id`),
  ADD CONSTRAINT `ecb_character` FOREIGN KEY (`Character`) REFERENCES `Characters` (`Id`);

ALTER TABLE `Event_Character_Discounts_Items`
  ADD CONSTRAINT `ecdi_event`     FOREIGN KEY (`Event`)     REFERENCES `Events` (`Id`),
  ADD CONSTRAINT `ecdi_character` FOREIGN KEY (`Character`) REFERENCES `Characters` (`Id`),
  ADD CONSTRAINT `ecdi_item`      FOREIGN KEY (`Item`)      REFERENCES `Items` (`Id`);

ALTER TABLE `Event_Character_Discounts_Implants`
  ADD CONSTRAINT `ecdim_event`     FOREIGN KEY (`Event`)     REFERENCES `Events` (`Id`),
  ADD CONSTRAINT `ecdim_character` FOREIGN KEY (`Character`) REFERENCES `Characters` (`Id`),
  ADD CONSTRAINT `ecdim_implant`   FOREIGN KEY (`Implant`)   REFERENCES `Implants` (`Id`);

ALTER TABLE `Event_Character_Discounts_Skills`
  ADD CONSTRAINT `ecds_event`     FOREIGN KEY (`Event`)     REFERENCES `Events` (`Id`),
  ADD CONSTRAINT `ecds_character` FOREIGN KEY (`Character`) REFERENCES `Characters` (`Id`),
  ADD CONSTRAINT `ecds_skill`     FOREIGN KEY (`Skill`)     REFERENCES `Skills` (`Id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
