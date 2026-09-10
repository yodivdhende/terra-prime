-- Missions (TP-0142.01)
--
-- A mission owns no print pool. How many prints it has is
-- SUM(Device_Printer.PrintsAvailable) across the printers linked to it through
-- Mission_Printer, so wheeling a printer in or out changes a mission's
-- availability without any Missions row being edited. There is deliberately no
-- PrintPool column, and no Arduino_Uids table -- a Port is a Devices row.
--
-- Ordering note (TP-0142.01 step 4): Mission_Printer needs Devices and the
-- printer role to exist, and the full device model (TP-0149) has not landed
-- yet. Rather than block the whole missions epic on it, the two tables
-- Mission_Printer actually depends on are created here, minimally and with
-- IF NOT EXISTS, so the later device-model migration extends them (extra
-- columns, the other role tables) instead of re-creating them.

CREATE TABLE IF NOT EXISTS `Devices` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Uid` varchar(255) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `dev_uid` (`Uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `Device_Printer` (
  `Device` int NOT NULL,
  `PrintsAvailable` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Device`),
  CONSTRAINT `dprn_device` FOREIGN KEY (`Device`) REFERENCES `Devices` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Missions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `PlayerLimit` int NOT NULL DEFAULT 0,
  `Status` ENUM('open','closed') NOT NULL DEFAULT 'open',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- No User column: the player is derived via CharacterVersion -> Character -> Owner.
CREATE TABLE `Mission_Participants` (
  `Mission` int NOT NULL,
  `CharacterVersion` int NOT NULL,
  `AvailablePrints` int NOT NULL DEFAULT 0,
  `RegisterAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Mission`, `CharacterVersion`),
  CONSTRAINT `mpart_mission` FOREIGN KEY (`Mission`) REFERENCES `Missions` (`Id`),
  CONSTRAINT `mpart_character_version` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Association only. The mission's available prints are the sum of
-- Device_Printer.PrintsAvailable over these rows.
CREATE TABLE `Mission_Printer` (
  `Mission` int NOT NULL,
  `Device` int NOT NULL,
  PRIMARY KEY (`Mission`, `Device`),
  CONSTRAINT `mprn_mission` FOREIGN KEY (`Mission`) REFERENCES `Missions` (`Id`),
  CONSTRAINT `mprn_device` FOREIGN KEY (`Device`) REFERENCES `Devices` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
