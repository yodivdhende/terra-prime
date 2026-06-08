---
id: TP-0003
title: Add Schrödinger the Cat as a Clippy-style guide on the Codex page
status: Done
assignee: []
created_date: '2026-05-12 15:45'
updated_date: '2026-06-08 14:23'
labels:
  - codex
  - ui
  - feature
dependencies: []
references:
  - 'https://knowyourmeme.com/memes/mona-%E3%83%A2%E3%83%8A%E3%83%BC'
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Codex page should feature a Clippy-style interactive guide character — a cat named Schrödinger. The character is displayed in the style of the Mona meme (a small, floating pixel/sprite art character anchored to a corner of the screen) with a speech bubble that provides contextual tips and guidance to the user as they interact with the Codex page.

The character should feel playful and thematic — Schrödinger the cat fits the Codex aesthetic and gives the page personality. Tips should be context-aware (e.g. hint about search, character creation, filtering) and dismissible.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Schrödinger the cat character is rendered as a small floating figure anchored to a corner of the Codex page (Mona meme style)
- [ ] #2 The character displays a speech bubble with a contextual tip or prompt relevant to what the user is currently doing on the page
- [ ] #3 At least 3 distinct tips are shown depending on page context (e.g. empty state, browsing, creating a character)
- [ ] #4 The speech bubble can be dismissed by the user (click away or close button)
- [ ] #5 The character can be toggled off/hidden persistently (preference saved to localStorage or equivalent)
- [ ] #6 Character and speech bubble are styled consistently with the existing Codex page design
- [ ] #7 Character renders correctly on both desktop and mobile layouts
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented all 4 subtasks: singleton manager, Svelte component with ASCII cat + bubble, desktop wiring with 1.5s greeting, and register flow step guidance + completion message.
<!-- SECTION:FINAL_SUMMARY:END -->
