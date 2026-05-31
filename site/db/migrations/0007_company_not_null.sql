-- Assign existing NULL-company rows to the first available company before enforcing NOT NULL
UPDATE Character_Versions cv
JOIN (SELECT MIN(Id) AS min_id FROM Companies) AS c ON c.min_id IS NOT NULL
SET cv.Company = c.min_id
WHERE cv.Company IS NULL;

ALTER TABLE Character_Versions MODIFY COLUMN `Company` int NOT NULL;
