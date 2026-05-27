---
id: TP-0002
title: Implement event registration wizard steps in register-window
status: Done
assignee: []
created_date: '2026-05-12 15:35'
updated_date: '2026-05-27 20:29'
labels:
  - codex
  - registration
  - frontend
dependencies: []
references:
  - site/src/lib/codex/components/register-window.svelte
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The register-window.svelte is scaffolded with a 4-step wizard (events → characters → create character → confirm) but all steps are placeholders. Each step needs its own dedicated component under site/src/lib/codex/components/ that is wired into the wizard shell.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All 4 wizard steps render their real component (no placeholder divs remain)
- [ ] #2 Navigating back and forward between steps preserves user selections
- [ ] #3 The wizard cannot advance past a step until a required selection is made
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed
<!-- SECTION:FINAL_SUMMARY:END -->
