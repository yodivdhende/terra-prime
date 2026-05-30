DROP TABLE IF EXISTS Event_Character_Discounts_Items;
DROP TABLE IF EXISTS Event_Character_Discounts_Implants;
DROP TABLE IF EXISTS Event_Character_Discounts_Skills;

ALTER TABLE Event_Character_Budget
  CHANGE COLUMN BudgetIncrease Budget INT NOT NULL DEFAULT 0;
