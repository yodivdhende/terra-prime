CREATE TABLE `Company_Discounts_Items` (
  `Company`  int NOT NULL,
  `Item`     int NOT NULL,
  `Discount` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Company`, `Item`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Company_Discounts_Implants` (
  `Company`  int NOT NULL,
  `Implant`  int NOT NULL,
  `Discount` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Company`, `Implant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Company_Discounts_Skills` (
  `Company`  int NOT NULL,
  `Skill`    int NOT NULL,
  `Discount` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`Company`, `Skill`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `Company_Discounts_Items`
  ADD CONSTRAINT `cdi_company` FOREIGN KEY (`Company`) REFERENCES `Companies` (`Id`),
  ADD CONSTRAINT `cdi_item`    FOREIGN KEY (`Item`)    REFERENCES `Items` (`Id`);

ALTER TABLE `Company_Discounts_Implants`
  ADD CONSTRAINT `cdim_company`  FOREIGN KEY (`Company`) REFERENCES `Companies` (`Id`),
  ADD CONSTRAINT `cdim_implant`  FOREIGN KEY (`Implant`) REFERENCES `Implants` (`Id`);

ALTER TABLE `Company_Discounts_Skills`
  ADD CONSTRAINT `cds_company` FOREIGN KEY (`Company`) REFERENCES `Companies` (`Id`),
  ADD CONSTRAINT `cds_skill`   FOREIGN KEY (`Skill`)   REFERENCES `Skills` (`Id`);
