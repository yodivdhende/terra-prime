---
id: TP-0010
title: Implement email verification system
status: Done
assignee: []
created_date: '2026-05-23 21:49'
updated_date: '2026-05-23 22:31'
labels: []
dependencies: []
priority: high
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add email verification for user accounts. Adds a Verified column to Users, a new Email_Templates table holding Google Doc URLs, a new Email_Verification_Tokens table, a Gmail-API-backed mailer, verification endpoints (auto-send on register, resend, admin-send), a frontend confirm page, and an admin manage UI for templates.

Design choices (confirmed with user):
- Mailer: Gmail API via the existing Google service account (requires Domain-Wide Delegation + impersonation subject env var)
- Templates: stored as { key, docUrl } only — no variables column. Subjects hardcoded per template key in code.
- Enforcement: verified flag tracked but not enforced yet — gating sensitive actions is a follow-up
- Link injection: server replaces a literal [[LINK]] marker in the fetched Doc HTML before sending
- Confirm step: link in email points at a frontend page that POSTs the token to the API

Full plan: /home/yodi/.claude/plans/implement-a-verification-sytem-linear-floyd.md
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users table has a Verified boolean column; existing users are grandfathered to verified=1
- [x] #2 Email_Templates table exists with { Id, Key (unique), DocUrl } and a seeded verify_email row
- [x] #3 Email_Verification_Tokens table exists with FK to Users and ExpiresAt
- [x] #4 Registering a new user automatically triggers a verification email (fire-and-forget; registration succeeds even if email send fails)
- [x] #5 Clicking the email link consumes the token and sets Users.Verified=1
- [x] #6 Authenticated user can POST to /api/authentication/verify-email/resend to re-send
- [x] #7 Admin can POST to /api/admin/emails/send to send any template to any address
- [x] #8 Admin has a /manage/emails CRUD UI to manage template { key, docUrl } rows
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Email verification system shipped. Schema: Users.Verified TINYINT (existing users grandfathered to 1, new users default 0), Email_Templates (key, docUrl), Email_Verification_Tokens (FK→Users, 24h expiry). Services: google-gmail-service.ts (service-account JWT + Gmail scope + DWD subject impersonation), email.service.ts (sendTemplated fetches Doc HTML via existing GoogleDriveService, replaces [[LINK]], looks up hardcoded subject by key). Verification flow: email_verification.repo (createToken, consumeToken, removeExpired), verification.service (sendVerificationEmail, confirmToken). Endpoints: POST /api/authentication/verify-email (public confirm), POST /api/authentication/verify-email/resend (self), POST /api/admin/emails/send (admin arbitrary), POST /api/admin/users/[id]/resend-verification (admin), full CRUD at /api/email-templates and /api/email-templates/[id]. Frontend: /verify-email confirm page, /manage/emails admin CRUD pages + nav link, /manage/users list shows Verified column, /manage/users/[id] shows status + resend button. Register endpoint now fire-and-forgets sendVerificationEmail. Drive-by fix: handleRequest was missing 'await cb()', causing all RequestError throws to bubble as 500s — fixed. API docs updated. Operator setup still needed: configure Domain-Wide Delegation in Google Workspace + replace the seeded verify_email DocUrl placeholder with a real Doc containing [[LINK]] marker. Out of scope (follow-ups): wiring Verified into sensitive-action gates; rate-limiting resend; manual mark-as-verified admin override.
<!-- SECTION:FINAL_SUMMARY:END -->
