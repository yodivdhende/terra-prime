-- 0020_subco_invite_email.sql
-- Email template row for the subco invite (mirror the verify_email seed in
-- 0003_email_verification.sql). The DocUrl is a placeholder — replace it with
-- the real Google Doc via the admin Email Templates UI (/manage/emails). The
-- doc body should contain the literal [[LINK]] marker for the invite link.
INSERT INTO `Email_Templates` (`Key`, `DocUrl`) VALUES
  ('subco_invite', 'https://docs.google.com/document/d/REPLACE_WITH_SUBCO_INVITE_DOC_ID/edit?usp=sharing');
