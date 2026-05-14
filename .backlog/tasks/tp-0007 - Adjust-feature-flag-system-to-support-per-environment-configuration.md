---
id: TP-0007
title: Adjust feature flag system to support per-environment configuration
status: To Do
assignee: []
created_date: '2026-05-14 14:48'
labels:
  - feature-flags
  - config
dependencies: []
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current feature flag system uses a single flat configuration. It needs to be extended to support different flag values per environment (dev, staging, prod), so that features can be toggled independently in each environment without code changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Feature flags can be configured independently for dev, staging, and prod environments
- [ ] #2 The active environment is determined at runtime (e.g. via an env variable or build config)
- [ ] #3 Existing flag behaviour is preserved — no regressions when no per-env override is set
- [ ] #4 Documentation or inline comments explain how to add a new per-env flag
<!-- AC:END -->
