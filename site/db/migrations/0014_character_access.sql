ALTER TABLE `Items`     ADD COLUMN `CharacterAccess` ENUM('all','none','specific') NOT NULL DEFAULT 'all';
ALTER TABLE `Implants`  ADD COLUMN `CharacterAccess` ENUM('all','none','specific') NOT NULL DEFAULT 'all';
ALTER TABLE `Expertise` ADD COLUMN `CharacterAccess` ENUM('all','none','specific') NOT NULL DEFAULT 'all';

CREATE TABLE `Item_Character_Access` (
  `ItemId` int NOT NULL,
  `CharacterId` int NOT NULL,
  PRIMARY KEY (`ItemId`,`CharacterId`),
  CONSTRAINT `ica_item` FOREIGN KEY (`ItemId`) REFERENCES `Items`(`Id`),
  CONSTRAINT `ica_character` FOREIGN KEY (`CharacterId`) REFERENCES `Characters`(`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Implant_Character_Access` (
  `ImplantId` int NOT NULL,
  `CharacterId` int NOT NULL,
  PRIMARY KEY (`ImplantId`,`CharacterId`),
  CONSTRAINT `imca_implant` FOREIGN KEY (`ImplantId`) REFERENCES `Implants`(`Id`),
  CONSTRAINT `imca_character` FOREIGN KEY (`CharacterId`) REFERENCES `Characters`(`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Expertise_Character_Access` (
  `ExpertiseId` int NOT NULL,
  `CharacterId` int NOT NULL,
  PRIMARY KEY (`ExpertiseId`,`CharacterId`),
  CONSTRAINT `eca_expertise` FOREIGN KEY (`ExpertiseId`) REFERENCES `Expertise`(`Id`),
  CONSTRAINT `eca_character` FOREIGN KEY (`CharacterId`) REFERENCES `Characters`(`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
