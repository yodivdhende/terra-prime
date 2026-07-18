ALTER TABLE `Subco_Invites`
  MODIFY COLUMN `ExpiresAt` datetime DEFAULT NULL,
  ADD COLUMN `Status` varchar(10) NOT NULL DEFAULT 'invited';
