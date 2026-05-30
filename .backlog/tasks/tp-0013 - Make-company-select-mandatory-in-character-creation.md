---
id: TP-0013
title: Make company select mandatory in character creation
status: To Do
assignee: []
created_date: '2026-05-30 21:18'
labels: []
dependencies: []
priority: medium
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Currently, the Company field in the character editor (character-editor.svelte) is optional — it defaults to null and no validation enforces a selection. Make it required.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CompanySelect component (src/lib/components/company-select.svelte): remove the blank '— select a company —' null option (or disable form submission while null), add required attribute to the select
- [ ] #2 Character_Versions.Company DB column: change DEFAULT NULL to NOT NULL (new migration)
- [ ] #3 Backend API endpoint(s) that upsert/create character versions: validate that company is present and reject with a clear error if missing
- [ ] #4 TypeScript type CharacterVersionBare.company updated from 'number | null' to 'number'
- [ ] #5 Existing character versions with company = NULL should be addressed (data migration or explicit decision)
<!-- AC:END -->
