ALTER TABLE `Subco` ADD `Company` int NOT NULL;--> statement-breakpoint
ALTER TABLE `Subco` ADD `BackstoryId` varchar(128);--> statement-breakpoint
ALTER TABLE `Subco` ADD CONSTRAINT `subco_company` FOREIGN KEY (`Company`) REFERENCES `Companies`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subco_company_key` ON `Subco` (`Company`);