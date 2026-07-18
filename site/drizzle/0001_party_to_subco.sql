ALTER TABLE `Party_Members` DROP FOREIGN KEY `Party_Members_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `Party_Members` DROP FOREIGN KEY `Party_Members_ibfk_2`;
--> statement-breakpoint
RENAME TABLE `Party` TO `Subco`, `Party_Members` TO `Subco_Members`;
--> statement-breakpoint
ALTER TABLE `Subco_Members` CHANGE COLUMN `Party` `Subco` int NOT NULL;
--> statement-breakpoint
ALTER TABLE `Subco_Members` ADD CONSTRAINT `Subco_Members_ibfk_1` FOREIGN KEY (`Subco`) REFERENCES `Subco`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Subco_Members` ADD CONSTRAINT `Subco_Members_ibfk_2` FOREIGN KEY (`Member`) REFERENCES `Characters`(`Id`) ON DELETE no action ON UPDATE no action;
