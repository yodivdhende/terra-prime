RENAME TABLE `Event_Participants` TO `Event_Players`;
--> statement-breakpoint
CREATE TABLE `Event_Extras` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Event` int NOT NULL,
	`User` int NOT NULL,
	`CharacterVersion` int,
	CONSTRAINT `Event_Extras_Id` PRIMARY KEY(`Id`),
	CONSTRAINT `ee_event_version` UNIQUE(`Event`,`CharacterVersion`)
);
--> statement-breakpoint
ALTER TABLE `Characters` ADD `Kind` enum('player','npc') DEFAULT 'player' NOT NULL;--> statement-breakpoint
ALTER TABLE `Event_Extras` ADD CONSTRAINT `ee_event` FOREIGN KEY (`Event`) REFERENCES `Events`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Event_Extras` ADD CONSTRAINT `ee_user` FOREIGN KEY (`User`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Event_Extras` ADD CONSTRAINT `ee_version` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ee_event_user` ON `Event_Extras` (`Event`,`User`);