-- 0017_rename_party_to_subco.sql
-- Rename the unused `Party` feature to `Subco` (sub-company).

-- Drop the foreign keys on Party_Members before renaming.
ALTER TABLE `Party_Members`
  DROP FOREIGN KEY `Party_Members_ibfk_1`,
  DROP FOREIGN KEY `Party_Members_ibfk_2`;

-- Rename the tables.
RENAME TABLE `Party` TO `Subco`, `Party_Members` TO `Subco_Members`;

-- Rename the `Party` column to `Subco`.
ALTER TABLE `Subco_Members`
  CHANGE COLUMN `Party` `Subco` int NOT NULL;

-- Recreate the foreign keys pointing at the renamed tables.
ALTER TABLE `Subco_Members`
  ADD CONSTRAINT `Subco_Members_ibfk_1` FOREIGN KEY (`Subco`) REFERENCES `Subco` (`Id`),
  ADD CONSTRAINT `Subco_Members_ibfk_2` FOREIGN KEY (`Member`) REFERENCES `Characters` (`Id`);
