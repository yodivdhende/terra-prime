CREATE TABLE `Device_AguesGuard` (
	`Device` int NOT NULL,
	`CharacterVersion` int NOT NULL,
	CONSTRAINT `Device_AguesGuard_Device_pk` PRIMARY KEY(`Device`)
);
--> statement-breakpoint
CREATE TABLE `Device_Game` (
	`Device` int NOT NULL,
	`Port` int NOT NULL,
	CONSTRAINT `Device_Game_Device_pk` PRIMARY KEY(`Device`)
);
--> statement-breakpoint
CREATE TABLE `Device_Light` (
	`Device` int NOT NULL,
	`Endpoint` varchar(255) NOT NULL,
	`Fixture` varchar(255) NOT NULL,
	CONSTRAINT `Device_Light_Device_pk` PRIMARY KEY(`Device`)
);
--> statement-breakpoint
CREATE TABLE `Device_Port` (
	`Device` int NOT NULL,
	CONSTRAINT `Device_Port_Device_pk` PRIMARY KEY(`Device`)
);
--> statement-breakpoint
ALTER TABLE `Device_AguesGuard` ADD CONSTRAINT `dagd_device` FOREIGN KEY (`Device`) REFERENCES `Devices`(`Id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Device_AguesGuard` ADD CONSTRAINT `dagd_character_version` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Device_Game` ADD CONSTRAINT `dgam_device` FOREIGN KEY (`Device`) REFERENCES `Devices`(`Id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Device_Game` ADD CONSTRAINT `dgam_port` FOREIGN KEY (`Port`) REFERENCES `Devices`(`Id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Device_Light` ADD CONSTRAINT `dlgt_device` FOREIGN KEY (`Device`) REFERENCES `Devices`(`Id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Device_Port` ADD CONSTRAINT `dprt_device` FOREIGN KEY (`Device`) REFERENCES `Devices`(`Id`) ON DELETE cascade ON UPDATE no action;