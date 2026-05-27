---
id: TP-0011
title: Implement forgot password / password reset flow
status: Done
assignee: []
created_date: '2026-05-27 11:42'
updated_date: '2026-05-27 12:39'
labels: []
dependencies: []
priority: high
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a password reset flow that lets users request an email with a one-time link to set a new password. Mirrors the email verification system (TP-0010): per-user single-active token in a Password_Reset_Tokens table (24h expiry), Email_Templates row keyed 'password_reset', token consumption via a public /api/authentication/reset-password endpoint. Entry points: codex login window (forgot-password mode), codex logout window (logged-in self-trigger), admin /manage/users/[id] (admin trigger).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Password_Reset_Tokens table exists with FK to Users.Id and ExpiresAt; Email_Templates seeded with a password_reset row
- [ ] #2 POST /api/authentication/forgot-password sends a reset email when email matches; returns 200 for unknown emails too (no enumeration)
- [ ] #3 POST /api/authentication/reset-password consumes a valid token and updates Users.Password; returns 400 for invalid/expired token
- [ ] #4 POST /api/admin/users/[id]/send-password-reset is admin-only and triggers a reset email for the target user
- [ ] #5 Codex login window has a 'Forgot password?' flow that prompts for email and triggers the reset email
- [ ] #6 Codex logout window (logged-in self) has a 'Reset password' button that triggers a reset email for the current user
- [ ] #7 /manage/users/[id] shows a 'Send password reset email' button with inline send/success/error feedback
- [ ] #8 Reset link points at /reset-password?token=...; that page lets the user set a new password and confirms it server-side
<!-- AC:END -->
