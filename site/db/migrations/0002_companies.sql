CREATE TABLE `Companies` (
  `Id`          int           NOT NULL,
  `Name`        varchar(255)  NOT NULL,
  `Description` text          NOT NULL,
  `Link`        varchar(2048) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE `Companies`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `Companies`
  MODIFY `Id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `Character_Versions`
  ADD COLUMN `Company` int DEFAULT NULL,
  ADD KEY `cv_company_key` (`Company`),
  ADD CONSTRAINT `cv_company` FOREIGN KEY (`Company`) REFERENCES `Companies` (`Id`);
