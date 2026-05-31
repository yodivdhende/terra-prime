---
id: TP-0013
title: Make company select mandatory in character creation
status: Done
assignee: []
created_date: '2026-05-30 21:18'
updated_date: '2026-05-31 13:10'
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

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed blank null option from CompanySelect and added required + auto-select-first-on-load. Changed CharacterVersionBare.company from number|null to number and updated isCharacterVersionBare type guard to reject null (covers API validation for all three upsert endpoints). Updated all 4 DB read methods to skip rows with null company. Fixed create/update SQL calls to drop ?? null. Added version.company == null check to character-manager ready derived. Wrote migration 0007_company_not_null.sql to UPDATE NULL rows to MIN(Id) company then ALTER COLUMN NOT NULL. Fixed admin endpoints that construct CharacterVersionBare to supply company.
<!-- SECTION:FINAL_SUMMARY:END -->
