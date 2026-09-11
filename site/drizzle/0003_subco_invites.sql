CREATE TABLE `Subco_Invites` (
	`Token` varchar(36) NOT NULL,
	`Subco` int NOT NULL,
	`Email` varchar(255) NOT NULL,
	`CharacterId` int,
	`CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ExpiresAt` datetime,
	`Status` varchar(10) NOT NULL DEFAULT 'invited',
	CONSTRAINT `Subco_Invites_Token` PRIMARY KEY(`Token`)
);
--> statement-breakpoint
ALTER TABLE `Subco_Invites` ADD CONSTRAINT `si_subco_fk` FOREIGN KEY (`Subco`) REFERENCES `Subco`(`Id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Subco_Invites` ADD CONSTRAINT `si_character_fk` FOREIGN KEY (`CharacterId`) REFERENCES `Characters`(`Id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `si_subco_key` ON `Subco_Invites` (`Subco`);--> statement-breakpoint
CREATE INDEX `si_character_key` ON `Subco_Invites` (`CharacterId`);--> statement-breakpoint
INSERT INTO `Email_Templates` (`Key`, `DocUrl`) VALUES
	('subco_invite', 'https://docs.google.com/document/d/REPLACE_WITH_SUBCO_INVITE_DOC_ID/edit?usp=sharing')
ON DUPLICATE KEY UPDATE `DocUrl` = VALUES(`DocUrl`);