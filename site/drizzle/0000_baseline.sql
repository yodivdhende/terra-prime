CREATE TABLE `Admins` (
	`UserId` int NOT NULL,
	CONSTRAINT `Admins_UserId_pk` PRIMARY KEY(`UserId`)
);
--> statement-breakpoint
CREATE TABLE `Character_Version_Expertise` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`CharacterVersion` int,
	`Expertise` int,
	`Value` int,
	CONSTRAINT `Character_Version_Expertise_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Character_Version_Implants` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`CharacterVersion` int,
	`Implant` int,
	`Slot` int NOT NULL DEFAULT 1,
	CONSTRAINT `Character_Version_Implants_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Character_Version_Items` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`CharacterVersion` int,
	`Item` int,
	`Count` int DEFAULT 1,
	CONSTRAINT `Character_Version_Items_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Character_Versions` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Character` int NOT NULL,
	`Name` varchar(254),
	`Company` int NOT NULL,
	CONSTRAINT `Character_Versions_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Characters` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(254),
	`Owner` int,
	`BackstoryId` varchar(128),
	`ImplantLimit` int NOT NULL DEFAULT 2,
	CONSTRAINT `Characters_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Companies` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(255) NOT NULL,
	`Description` text NOT NULL,
	`Link` varchar(2048),
	CONSTRAINT `Companies_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Company_Discounts_Expertise` (
	`Company` int NOT NULL,
	`Expertise` int NOT NULL,
	`Discount` int NOT NULL DEFAULT 0,
	CONSTRAINT `Company_Discounts_Expertise_Company_Expertise_pk` PRIMARY KEY(`Company`,`Expertise`),
	CONSTRAINT `cde_discount_pct` CHECK(`Discount` between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE `Company_Discounts_Implants` (
	`Company` int NOT NULL,
	`Implant` int NOT NULL,
	`Discount` int NOT NULL DEFAULT 0,
	CONSTRAINT `Company_Discounts_Implants_Company_Implant_pk` PRIMARY KEY(`Company`,`Implant`),
	CONSTRAINT `cdim_discount_pct` CHECK(`Discount` between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE `Company_Discounts_Items` (
	`Company` int NOT NULL,
	`Item` int NOT NULL,
	`Discount` int NOT NULL DEFAULT 0,
	CONSTRAINT `Company_Discounts_Items_Company_Item_pk` PRIMARY KEY(`Company`,`Item`),
	CONSTRAINT `cdi_discount_pct` CHECK(`Discount` between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE `Email_Templates` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Key` varchar(64) NOT NULL,
	`DocUrl` varchar(2048) NOT NULL,
	CONSTRAINT `Email_Templates_Id` PRIMARY KEY(`Id`),
	CONSTRAINT `et_key_unique` UNIQUE(`Key`)
);
--> statement-breakpoint
CREATE TABLE `Email_Verification_Tokens` (
	`Token` varchar(255) NOT NULL,
	`UserId` int NOT NULL,
	`CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ExpiresAt` datetime NOT NULL,
	CONSTRAINT `Email_Verification_Tokens_Token_pk` PRIMARY KEY(`Token`)
);
--> statement-breakpoint
CREATE TABLE `Event_Coupons` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Event` int NOT NULL,
	`User` int NOT NULL,
	`Code` varchar(64) NOT NULL,
	`Type` enum('budget') NOT NULL DEFAULT 'budget',
	`Value` int NOT NULL DEFAULT 0,
	`RedeemedAt` datetime,
	CONSTRAINT `Event_Coupons_Id` PRIMARY KEY(`Id`),
	CONSTRAINT `ec_code` UNIQUE(`Code`)
);
--> statement-breakpoint
CREATE TABLE `Event_Participants` (
	`Event` int NOT NULL,
	`User` int NOT NULL,
	`CharacterVersion` int,
	CONSTRAINT `Event_Participants_Event_User_pk` PRIMARY KEY(`Event`,`User`)
);
--> statement-breakpoint
CREATE TABLE `Events` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(254),
	`StartTime` datetime,
	`EndTime` datetime,
	`Status` enum('Draft','Open','Live','Canceled','Done') DEFAULT 'Draft',
	`Budget` int,
	`FormId` varchar(128),
	`SheetId` varchar(128),
	`RewardBudget` int,
	CONSTRAINT `Events_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Expertise` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Group` int,
	`Name` varchar(255),
	`Description` text,
	`CharacterAccess` enum('all','none','specific') NOT NULL DEFAULT 'all',
	`Icon` text,
	CONSTRAINT `Expertise_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Expertise_Character_Access` (
	`ExpertiseId` int NOT NULL,
	`CharacterId` int NOT NULL,
	CONSTRAINT `Expertise_Character_Access_ExpertiseId_CharacterId_pk` PRIMARY KEY(`ExpertiseId`,`CharacterId`)
);
--> statement-breakpoint
CREATE TABLE `Expertise_Groups` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(255) NOT NULL,
	`Description` text NOT NULL,
	`Icon` text,
	`Color` varchar(7),
	CONSTRAINT `Expertise_Groups_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Expertise_Point_Costs` (
	`Point` tinyint NOT NULL,
	`Cost` int NOT NULL DEFAULT 0,
	CONSTRAINT `Expertise_Point_Costs_Point_pk` PRIMARY KEY(`Point`),
	CONSTRAINT `epc_point_range` CHECK(`Point` between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE `Implant_Character_Access` (
	`ImplantId` int NOT NULL,
	`CharacterId` int NOT NULL,
	CONSTRAINT `Implant_Character_Access_ImplantId_CharacterId_pk` PRIMARY KEY(`ImplantId`,`CharacterId`)
);
--> statement-breakpoint
CREATE TABLE `Implants` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(255) NOT NULL,
	`Description` text NOT NULL,
	`Cost` int NOT NULL DEFAULT 0,
	`CharacterAccess` enum('all','none','specific') NOT NULL DEFAULT 'all',
	CONSTRAINT `Implants_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Item_Character_Access` (
	`ItemId` int NOT NULL,
	`CharacterId` int NOT NULL,
	CONSTRAINT `Item_Character_Access_ItemId_CharacterId_pk` PRIMARY KEY(`ItemId`,`CharacterId`)
);
--> statement-breakpoint
CREATE TABLE `Items` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(255) NOT NULL,
	`Description` text NOT NULL,
	`Cost` int NOT NULL DEFAULT 0,
	`MaxPerCharacter` int,
	`CharacterAccess` enum('all','none','specific') NOT NULL DEFAULT 'all',
	CONSTRAINT `Items_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Messages` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Sender` int,
	`Recipient` int NOT NULL,
	`Subject` varchar(512) NOT NULL,
	`Message` text NOT NULL,
	`Attachment` json NOT NULL,
	CONSTRAINT `Messages_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Party` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(254),
	CONSTRAINT `Party_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE TABLE `Party_Members` (
	`Party` int NOT NULL,
	`Member` int NOT NULL,
	CONSTRAINT `Party_Members_Party_Member_pk` PRIMARY KEY(`Party`,`Member`)
);
--> statement-breakpoint
CREATE TABLE `Password_Reset_Tokens` (
	`Token` varchar(255) NOT NULL,
	`UserId` int NOT NULL,
	`CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ExpiresAt` datetime NOT NULL,
	CONSTRAINT `Password_Reset_Tokens_Token_pk` PRIMARY KEY(`Token`)
);
--> statement-breakpoint
CREATE TABLE `Session_Roles` (
	`Token` varchar(255) NOT NULL,
	`Role` varchar(255) NOT NULL,
	CONSTRAINT `Session_Roles_Token_Role_pk` PRIMARY KEY(`Token`,`Role`)
);
--> statement-breakpoint
CREATE TABLE `Sessions` (
	`Token` varchar(255) NOT NULL,
	`UserId` int,
	`Description` varchar(500),
	`Start` datetime NOT NULL,
	`End` datetime,
	CONSTRAINT `Sessions_Token_pk` PRIMARY KEY(`Token`)
);
--> statement-breakpoint
CREATE TABLE `Users` (
	`Id` int AUTO_INCREMENT NOT NULL,
	`Name` varchar(255),
	`Email` varchar(255),
	`Password` varchar(255),
	`Verified` boolean NOT NULL DEFAULT false,
	CONSTRAINT `Users_Id` PRIMARY KEY(`Id`)
);
--> statement-breakpoint
CREATE INDEX `CharacterVersion` ON `Character_Version_Expertise` (`CharacterVersion`);
--> statement-breakpoint
CREATE INDEX `Skill` ON `Character_Version_Expertise` (`Expertise`);
--> statement-breakpoint
CREATE INDEX `CharacterVersion` ON `Character_Version_Implants` (`CharacterVersion`);
--> statement-breakpoint
CREATE INDEX `Implant` ON `Character_Version_Implants` (`Implant`);
--> statement-breakpoint
CREATE INDEX `CharacterVersion` ON `Character_Version_Items` (`CharacterVersion`);
--> statement-breakpoint
CREATE INDEX `Item` ON `Character_Version_Items` (`Item`);
--> statement-breakpoint
CREATE INDEX `Character` ON `Character_Versions` (`Character`);
--> statement-breakpoint
CREATE INDEX `cv_company_key` ON `Character_Versions` (`Company`);
--> statement-breakpoint
CREATE INDEX `Owner` ON `Characters` (`Owner`);
--> statement-breakpoint
CREATE INDEX `evt_user_key` ON `Email_Verification_Tokens` (`UserId`);
--> statement-breakpoint
CREATE INDEX `ec_event_user` ON `Event_Coupons` (`Event`,`User`);
--> statement-breakpoint
CREATE INDEX `User` ON `Event_Participants` (`User`);
--> statement-breakpoint
CREATE INDEX `Group` ON `Expertise` (`Group`);
--> statement-breakpoint
CREATE INDEX `Member` ON `Party_Members` (`Member`);
--> statement-breakpoint
CREATE INDEX `prt_user_key` ON `Password_Reset_Tokens` (`UserId`);
--> statement-breakpoint
ALTER TABLE `Admins` ADD CONSTRAINT `Admins_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Character_Version_Expertise` ADD CONSTRAINT `Character_Version_Expertise_ibfk_1` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Character_Version_Implants` ADD CONSTRAINT `Character_Version_Implants_ibfk_1` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Character_Version_Implants` ADD CONSTRAINT `Character_Version_Implants_ibfk_2` FOREIGN KEY (`Implant`) REFERENCES `Implants`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Character_Version_Items` ADD CONSTRAINT `Character_Version_Items_ibfk_1` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Character_Version_Items` ADD CONSTRAINT `Character_Version_Items_ibfk_2` FOREIGN KEY (`Item`) REFERENCES `Items`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Character_Versions` ADD CONSTRAINT `Character_Versions_Characters` FOREIGN KEY (`Character`) REFERENCES `Characters`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Character_Versions` ADD CONSTRAINT `cv_company` FOREIGN KEY (`Company`) REFERENCES `Companies`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Characters` ADD CONSTRAINT `Characters_ibfk_1` FOREIGN KEY (`Owner`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Company_Discounts_Expertise` ADD CONSTRAINT `cds_company` FOREIGN KEY (`Company`) REFERENCES `Companies`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Company_Discounts_Expertise` ADD CONSTRAINT `cds_skill` FOREIGN KEY (`Expertise`) REFERENCES `Expertise`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Company_Discounts_Implants` ADD CONSTRAINT `cdim_company` FOREIGN KEY (`Company`) REFERENCES `Companies`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Company_Discounts_Implants` ADD CONSTRAINT `cdim_implant` FOREIGN KEY (`Implant`) REFERENCES `Implants`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Company_Discounts_Items` ADD CONSTRAINT `cdi_company` FOREIGN KEY (`Company`) REFERENCES `Companies`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Company_Discounts_Items` ADD CONSTRAINT `cdi_item` FOREIGN KEY (`Item`) REFERENCES `Items`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Email_Verification_Tokens` ADD CONSTRAINT `evt_user_fk` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Event_Coupons` ADD CONSTRAINT `ec_event` FOREIGN KEY (`Event`) REFERENCES `Events`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Event_Coupons` ADD CONSTRAINT `ec_user` FOREIGN KEY (`User`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Event_Participants` ADD CONSTRAINT `Event_Participants_ibfk_1` FOREIGN KEY (`Event`) REFERENCES `Events`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Event_Participants` ADD CONSTRAINT `Event_Participants_ibfk_2` FOREIGN KEY (`User`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Event_Participants` ADD CONSTRAINT `Event_Participants_ibfk_3` FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Expertise` ADD CONSTRAINT `Expertise_ibfk_1` FOREIGN KEY (`Group`) REFERENCES `Expertise_Groups`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Expertise_Character_Access` ADD CONSTRAINT `eca_expertise` FOREIGN KEY (`ExpertiseId`) REFERENCES `Expertise`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Expertise_Character_Access` ADD CONSTRAINT `eca_character` FOREIGN KEY (`CharacterId`) REFERENCES `Characters`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Implant_Character_Access` ADD CONSTRAINT `imca_implant` FOREIGN KEY (`ImplantId`) REFERENCES `Implants`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Implant_Character_Access` ADD CONSTRAINT `imca_character` FOREIGN KEY (`CharacterId`) REFERENCES `Characters`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Item_Character_Access` ADD CONSTRAINT `ica_item` FOREIGN KEY (`ItemId`) REFERENCES `Items`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Item_Character_Access` ADD CONSTRAINT `ica_character` FOREIGN KEY (`CharacterId`) REFERENCES `Characters`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Messages` ADD CONSTRAINT `Messages_ibfk_1` FOREIGN KEY (`Sender`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Messages` ADD CONSTRAINT `Messages_ibfk_2` FOREIGN KEY (`Recipient`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Party_Members` ADD CONSTRAINT `Party_Members_ibfk_1` FOREIGN KEY (`Party`) REFERENCES `Party`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Party_Members` ADD CONSTRAINT `Party_Members_ibfk_2` FOREIGN KEY (`Member`) REFERENCES `Characters`(`Id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Password_Reset_Tokens` ADD CONSTRAINT `prt_user_fk` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Session_Roles` ADD CONSTRAINT `Session_Roles_ibfk_1` FOREIGN KEY (`Token`) REFERENCES `Sessions`(`Token`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `Sessions` ADD CONSTRAINT `Sessions_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users`(`Id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
INSERT INTO `Email_Templates` (`Key`, `DocUrl`) VALUES
	('verify_email', 'https://docs.google.com/document/d/1OKVxCxIyNfzP-j5BrIx_59g4uXNuBjVpk9QN0pUkK2A/edit?usp=sharing'),
	('password_reset', 'https://docs.google.com/document/d/1rQMErsWOTvYeAQgil7QLljIQzKl3r6Bg129SVZKTQwE/edit?usp=sharing')
ON DUPLICATE KEY UPDATE `DocUrl` = VALUES(`DocUrl`)
