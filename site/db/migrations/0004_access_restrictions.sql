CREATE TABLE `Character_Item_Access` (
  `Character` int NOT NULL,
  `Item`      int NOT NULL,
  PRIMARY KEY (`Character`, `Item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Character_Implant_Access` (
  `Character` int NOT NULL,
  `Implant`   int NOT NULL,
  PRIMARY KEY (`Character`, `Implant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `Character_Item_Access`
  ADD CONSTRAINT `cia_character` FOREIGN KEY (`Character`) REFERENCES `Characters` (`Id`),
  ADD CONSTRAINT `cia_item`      FOREIGN KEY (`Item`)      REFERENCES `Items` (`Id`);

ALTER TABLE `Character_Implant_Access`
  ADD CONSTRAINT `cima_character` FOREIGN KEY (`Character`) REFERENCES `Characters` (`Id`),
  ADD CONSTRAINT `cima_implant`   FOREIGN KEY (`Implant`)   REFERENCES `Implants` (`Id`);
