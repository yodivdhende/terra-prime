CREATE TABLE `Device_Printer` (
	`Device` int NOT NULL,
	`PrintsAvailable` int NOT NULL DEFAULT 0,
	CONSTRAINT `Device_Printer_Device_pk` PRIMARY KEY(`Device`)
);
--> statement-breakpoint
CREATE TABLE `Devices` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(255) NOT NULL,
	`Uid` varchar(255) NOT NULL,
	CONSTRAINT `Devices_Id` PRIMARY KEY(`Id`),
	CONSTRAINT `dev_uid` UNIQUE(`Uid`)
);
--> statement-breakpoint
CREATE TABLE `Mission_Participants` (
	`Mission` int NOT NULL,
	`CharacterVersion` int NOT NULL,
	`AvailablePrints` int NOT NULL DEFAULT 0,
	`RegisterAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Mission_Participants_Mission_CharacterVersion_pk` PRIMARY KEY(`Mission`,`CharacterVersion`)
);
--> statement-breakpoint
CREATE TABLE `Mission_Printer` (
	`Mission` int NOT NULL,
	`Device` int NOT NULL,
	CONSTRAINT `Mission_Printer_Mission_Device_pk` PRIMARY KEY(`Mission`,`Device`)
);
--> statement-breakpoint
CREATE TABLE `Missions` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(255) NOT NULL,
	`PlayerLimit` int NOT NULL DEFAULT 0,
	`Status` enum('open','closed') NOT NULL DEFAULT 'open',
	`CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Missions_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
ALTER TABLE `Device_Printer` ADD CONSTRAINT `dprn_device` FOREIGN KEY (`Device`) REFERENCES `Devices`(`Id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Mission_Participants` ADD CONSTRAINT `mpart_mission` FOREIGN KEY (`Mission`) REFERENCES `Missions`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Mission_Participants` ADD CONSTRAINT `mpart_character_version` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Mission_Printer` ADD CONSTRAINT `mprn_mission` FOREIGN KEY (`Mission`) REFERENCES `Missions`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Mission_Printer` ADD CONSTRAINT `mprn_device` FOREIGN KEY (`Device`) REFERENCES `Devices`(`Id`) ON DELETE no action ON UPDATE no action;