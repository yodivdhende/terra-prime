ALTER TABLE `Expertise_Point_Costs` DROP CONSTRAINT `epc_point_range`;
ALTER TABLE `Expertise_Point_Costs` ADD CONSTRAINT `epc_point_range` CHECK (`Point` BETWEEN 0 AND 100);

DELETE FROM `Expertise_Point_Costs`;
INSERT INTO `Expertise_Point_Costs` (`Point`, `Cost`) VALUES (100, 1000);

UPDATE `Company_Discounts_Items` SET `Discount` = 0;
UPDATE `Company_Discounts_Implants` SET `Discount` = 0;
UPDATE `Company_Discounts_Expertise` SET `Discount` = 0;

ALTER TABLE `Company_Discounts_Items` ADD CONSTRAINT `cdi_discount_pct` CHECK (`Discount` BETWEEN 0 AND 100);
ALTER TABLE `Company_Discounts_Implants` ADD CONSTRAINT `cdim_discount_pct` CHECK (`Discount` BETWEEN 0 AND 100);
ALTER TABLE `Company_Discounts_Expertise` ADD CONSTRAINT `cde_discount_pct` CHECK (`Discount` BETWEEN 0 AND 100);
