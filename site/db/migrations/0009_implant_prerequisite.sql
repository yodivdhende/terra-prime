ALTER TABLE `Implants`
  ADD COLUMN `Prerequisite` int NULL DEFAULT NULL,
  ADD CONSTRAINT `Implants_prerequisite_fk` FOREIGN KEY (`Prerequisite`) REFERENCES `Implants` (`Id`) ON DELETE SET NULL;
