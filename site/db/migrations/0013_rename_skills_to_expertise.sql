RENAME TABLE `Skills` TO `Expertise`;
RENAME TABLE `Skill_Groups` TO `Expertise_Groups`;
RENAME TABLE `Character_Version_Skills` TO `Character_Version_Expertise`;
RENAME TABLE `Company_Discounts_Skills` TO `Company_Discounts_Expertise`;

ALTER TABLE `Character_Version_Expertise`
  CHANGE COLUMN `Skill` `Expertise` int DEFAULT NULL;

ALTER TABLE `Company_Discounts_Expertise`
  CHANGE COLUMN `Skill` `Expertise` int NOT NULL;
