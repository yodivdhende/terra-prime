---
id: TP-0015
title: Link Google Form to event registration
status: Done
assignee: []
created_date: '2026-05-30 23:17'
updated_date: '2026-05-31 13:24'
labels:
  - codex
  - registration
  - frontend
  - backend
dependencies: []
references:
  - site/src/lib/codex/components/register-step-events.svelte
  - site/src/lib/codex/components/register-step-confirm.svelte
  - site/src/lib/codex/components/form-window.svelte
priority: high
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allow an admin to attach a Google Form to an event. When a player registers, the form fields render inside the events step of the wizard, and the answers are POSTed to Google Forms before saving the participant record. Form submission is treated as a hard requirement — if it fails, the participant is not saved and the user is shown a fallback link to the form's responder URL.

The branch already ships the form rendering infrastructure (`google-form-service.ts`, `/api/forms/[formId]` GET/submit endpoints, `form-window.svelte` for standalone form display). This parent ticket coordinates four sub-tasks that connect that infrastructure to event registration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Admin can set/clear a Google Form ID on an event from /manage/events/[id]
- [ ] #2 register-step-events.svelte renders the linked form's fields under the selected event (no fields if no form is linked)
- [ ] #3 Next is disabled until all required form questions are answered
- [ ] #4 confirm registration POSTs answers to /api/forms/{formId}/submit first, then PUTs /api/my/events/{eventId}/participants
- [ ] #5 If form submit fails, participant is not created and the user sees an error with a link to the form's responder URL
- [ ] #6 Navigating back and forward in the wizard preserves typed form answers
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All 4 subtasks complete: DB migration + repo + admin UI (01), form-fields refactor (02), register-manager form state + register-step-events rendering (03), confirm-step form submission gating (04).
<!-- SECTION:FINAL_SUMMARY:END -->
