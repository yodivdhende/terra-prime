-- 0022_subco_owner.sql
-- Store the creator of a subco as its owner. Only the owner may rename the
-- subco; an admin can transfer ownership from the manage page.

-- Subco is still behind a feature flag with no real usage yet; clear
-- existing rows before adding the NOT NULL owner column (mirrors 0018).
DELETE FROM `Subco_Members`;
DELETE FROM `Subco`;

ALTER TABLE `Subco`
  ADD COLUMN `Owner` int NOT NULL,
  ADD KEY `subco_owner_key` (`Owner`),
  ADD CONSTRAINT `subco_owner` FOREIGN KEY (`Owner`) REFERENCES `Users` (`Id`);
