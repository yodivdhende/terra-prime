---
id: tp-0005
title: Add inline registration to login-window
status: Done
assignee: []
created_date: ''
updated_date: '2026-05-27 20:29'
labels: []
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The `login-window.svelte` currently links out to `/main/login/register` for new user registration, breaking the Codex desktop metaphor by navigating away. Registration should be handled inline within the window, toggling between a login view and a registration view.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

- [ ] The login window shows a "Register" button/link that toggles to a registration form in-place (no page navigation)
- [ ] The registration form collects: Name, Email, Password, Confirm Password
- [ ] On submit, POSTs to `/api/authentication/register` (or the existing `+page.server.ts` action at `/main/login/register`) using `use:enhance`
- [ ] On success, auto-logs the user in (sets `CREDENTIAL_STORE.roles` and `.name`) and closes the window — same behaviour as `handleLogin`
- [ ] On error, displays an inline error message styled consistently with the existing `.error` span
- [ ] A "Back to login" link/button returns to the login view
- [ ] The external `<a href="/main/login/register">` link is removed
- [ ] Window height accommodates the taller registration form (update `createLoginWindow()` dimensions if needed)

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed
<!-- SECTION:FINAL_SUMMARY:END -->

## Notes

- Keep both views in `login-window.svelte` — toggle with a local `$state` boolean (e.g. `showRegister`)
- Match existing styling conventions (monospace font, transparent inputs, accent-border buttons)
- Check `src/routes/api/authentication/register/` for the register endpoint shape
