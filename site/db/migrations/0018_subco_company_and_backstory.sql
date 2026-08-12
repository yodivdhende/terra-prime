-- 0018_subco_company_and_backstory.sql
-- Give a subco exactly one Company (enforced in app code across member
-- character versions) and its own shared background link.

-- Existing rows have no company assignment so they are invalid; clear them
-- before adding the NOT NULL FK column.
DELETE FROM `Subco_Members`;
DELETE FROM `Subco`;

ALTER TABLE `Subco`
  ADD COLUMN `Company` int NOT NULL,
  ADD COLUMN `BackstoryId` varchar(128) DEFAULT NULL,
  ADD KEY `subco_company_key` (`Company`),
  ADD CONSTRAINT `subco_company` FOREIGN KEY (`Company`) REFERENCES `Companies` (`Id`);
