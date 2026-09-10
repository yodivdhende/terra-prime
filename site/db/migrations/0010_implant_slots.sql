-- Add implant limit to Characters, add slot to Character_Version_Implants, drop prerequisite from Implants

ALTER TABLE `Characters`
  ADD COLUMN `ImplantLimit` int NOT NULL DEFAULT 2;

ALTER TABLE `Character_Version_Implants`
  ADD COLUMN `Slot` int NOT NULL DEFAULT 1;

-- Backfill existing rows with sequential slot numbers per character version
SET @row_number := 0;
SET @current_version := 0;

UPDATE Character_Version_Implants cvi
  JOIN (
    SELECT Id,
      @row_number := IF(@current_version = CharacterVersion, @row_number + 1, 1) AS rn,
      @current_version := CharacterVersion AS cv
    FROM Character_Version_Implants
    ORDER BY CharacterVersion, Id
  ) AS ranked ON cvi.Id = ranked.Id
SET cvi.Slot = ranked.rn;

-- Drop prerequisite from Implants
ALTER TABLE `Implants`
  DROP FOREIGN KEY `Implants_prerequisite_fk`,
  DROP COLUMN `Prerequisite`;
