---
id: TP-0018
title: Migrate manage list pages to use DataTable component
status: To Do
assignee: []
created_date: '2026-06-02'
labels:
  - ui
  - manage
  - refactor
dependencies:
  - TP-0017
references:
  - site/src/routes/manage/users/+page.svelte
  - site/src/routes/manage/skills/+page.svelte
  - site/src/routes/manage/skills/groups/+page.svelte
  - site/src/routes/manage/events/+page.svelte
  - site/src/routes/manage/items/+page.svelte
  - site/src/routes/manage/implants/+page.svelte
  - site/src/routes/manage/companies/+page.svelte
  - site/src/routes/manage/emails/+page.svelte
  - site/src/lib/components/data-table.svelte
priority: medium
ordinal: 1001
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
All manage list pages currently hand-roll their own `<table>` with `{#each}` loops and no filtering. Migrate each page to use the `DataTable` component created in TP-0017. This removes duplicated table markup and adds per-column filtering to every manage list page.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- SECTION:ACCEPTANCE_CRITERIA:BEGIN -->
- [ ] All 8 manage list pages use `<DataTable>` with a `{#snippet row}` for row rendering
- [ ] Each page defines a `columns` array matching its existing `<th>` headers and data field keys
- [ ] The `<CirclePlus>` add button remains above `<DataTable>` on pages that have it
- [ ] Domain-specific cell styles (e.g. `td.verified` on users page) are kept in the page's own `<style>` block
- [ ] Duplicated `tr`/`td` structural CSS is removed from each page (now handled by the component)
- [ ] `npm run check` passes with no TypeScript errors
- [ ] Each page visually matches its pre-migration appearance; filters work on all columns
<!-- SECTION:ACCEPTANCE_CRITERIA:END -->

## Implementation Notes

<!-- SECTION:IMPLEMENTATION_NOTES:BEGIN -->
**Migration pattern for each page:**

1. Add import: `import DataTable from '$lib/components/data-table.svelte';`
2. Define columns:
   ```ts
   const columns = [
     { label: 'Id', key: 'id' },
     { label: 'Name', key: 'name' },
     // ... match existing <th> headers
   ];
   ```
3. Replace `<table>…</table>` with:
   ```svelte
   <DataTable items={data.XYZ} {columns}>
     {#snippet row(item)}
       {@const typed = item as MyType}
       <tr><!-- existing td content --></tr>
     {/snippet}
   </DataTable>
   ```
4. Remove duplicated `tr`/`td` CSS from `<style>`; keep domain-specific cell rules.

**Per-page column definitions:**

| Page | `items=` | Columns (label → key) |
|---|---|---|
| `manage/users` | `data.users` | Id→id, Name→name, Email→email, Verified→verified |
| `manage/skills` | `data.skills` | Id→id, Group→groupName, Name→name, Description→description |
| `manage/skills/groups` | `data.groups` | Id→id, Name→name, Description→description |
| `manage/events` | `displayEvents` | Id→id, Name→name, Start→start, End→end, Status→status |
| `manage/items` | `data.items` | Id→id, Name→name, Description→description |
| `manage/implants` | `data.implants` | Id→id, Name→name, Description→description |
| `manage/companies` | `data.companies` | Id→id, Name→name |
| `manage/emails` | `data.templates` | Id→id, Key→key |

**Events page special case:** The events page uses a local `$state` array with `Date` objects. Pre-format into a `$derived` display array so filter strings match displayed values:
```ts
let displayEvents = $derived(
  events.map(e => ({
    ...e,
    start: dateToHTMLDateTime(e.start),
    end: dateToHTMLDateTime(e.end),
  }))
);
```
Then bind `items={displayEvents}` and render `{item.start}` directly in the snippet.
<!-- SECTION:IMPLEMENTATION_NOTES:END -->
