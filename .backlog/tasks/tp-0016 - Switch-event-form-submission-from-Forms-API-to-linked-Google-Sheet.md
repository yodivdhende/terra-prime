---
id: TP-0016
title: Switch event form submission from Forms API to linked Google Sheet
status: Done
assignee: []
created_date: '2026-05-31 19:27'
updated_date: '2026-05-31 19:35'
labels:
  - codex
  - registration
  - backend
dependencies: []
priority: high
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

The current submission path in `site/src/lib/services/google-form-service.ts` scrapes the public viewform HTML and POSTs to formResponse. This is brittle and ultimately a dead end — the service account only has `forms.body.readonly` and Google Forms has no API submission endpoint.

Replace it with: each event that has a linked form gets a Google Spreadsheet in the workspace Drive folder `1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J`. Each registration writes a row via the Sheets API. The spreadsheet is created eagerly when an admin attaches a FormId. When the form's questions later change, a new tab is added to the same spreadsheet rather than mutating existing data.

`SheetId` is stored on the Events table next to FormId. Every row always includes userId, name, and email.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Admin save on an event with FormId (and no SheetId) creates a Spreadsheet in the workspace Drive folder and stores SheetId
- [x] #2 Spreadsheet header row begins with Timestamp, User ID, Name, Email, then one column per Google Form question in form order
- [x] #3 Authenticated registration appends a row to the linked spreadsheet with the user's id/name/email and their answers in column order
- [x] #4 If the form's questions change so the expected header no longer matches the latest tab, a new tab is added to the same spreadsheet for the new schema
- [x] #5 Unauthenticated POST to the new submit endpoint returns 401; event with no FormId returns 404
- [x] #6 Dead code removed: old submitForm and /api/forms/[formId]/submit route
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All 6 subtasks complete. Events table now carries SheetId; admin save eagerly creates the response spreadsheet in Drive folder 1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J with header [Timestamp, User ID, Name, Email, ...form questions]; new POST /api/my/events/[eventId]/form-submit is auth-gated and appends a row, lazy-creating the sheet if eager-create previously failed and adding a new tab if the form's questions have drifted from the latest tab's header. Old scrape path and route deleted.
<!-- SECTION:FINAL_SUMMARY:END -->
