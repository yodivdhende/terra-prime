-- Both columns arrive together, so there is nothing to backfill: every `Implants` row starts at
-- `MaxCharges` 0, and a fitted implant is seeded from its catalog entry when the instance is
-- written (`characterVersionRepo.saveImplants`).
ALTER TABLE `Implants` ADD `MaxCharges` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `Character_Version_Implants` ADD `ChargesRemaining` int DEFAULT 0 NOT NULL;
