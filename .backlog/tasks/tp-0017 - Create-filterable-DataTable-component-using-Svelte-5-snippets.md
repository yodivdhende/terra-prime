---
id: TP-0017
title: Create filterable DataTable component using Svelte 5 snippets
status: To Do
assignee: []
created_date: '2026-06-02'
labels:
  - ui
  - component
  - manage
dependencies: []
references:
  - site/src/lib/components/data-table.svelte
  - site/src/lib/styles/theme.css
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Most manage pages display data in hand-rolled `<table>` blocks with no filtering. Create a reusable `DataTable` component that accepts column definitions and a Svelte 5 **snippet** for row rendering, and handles per-column text filtering internally.

This component will be used by all manage list pages (TP-0018).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- SECTION:ACCEPTANCE_CRITERIA:BEGIN -->
- [ ] Component created at `site/src/lib/components/data-table.svelte`
- [ ] Accepts `items: Record<string, unknown>[]`, `columns: { label: string; key: string }[]`, and a `row` snippet
- [ ] Renders a `<thead>` with each column label plus a text filter `<input>` underneath it
- [ ] Filters rows client-side as user types — all active column filters are ANDed together, case-insensitive substring match
- [ ] Row snippet receives each filtered item and must render a `<tr>`
- [ ] Styled with theme variables (`--color-accent`, `--color-main`, `--border-color-dim`, `--font-mono`)
- [ ] `npm run check` passes with no TypeScript errors
<!-- SECTION:ACCEPTANCE_CRITERIA:END -->

## Implementation Notes

<!-- SECTION:IMPLEMENTATION_NOTES:BEGIN -->
**Props interface:**
```ts
type Column = { label: string; key: string };
let {
  items,
  columns,
  row
}: {
  items: Record<string, unknown>[];
  columns: Column[];
  row: Snippet<[Record<string, unknown>]>;
} = $props();
```

**Filtering:**
```ts
let filters: string[] = $state(columns.map(() => ''));
let filteredItems = $derived(
  items.filter(item =>
    columns.every((col, i) => {
      const f = filters[i];
      if (!f) return true;
      return String(item[col.key] ?? '').toLowerCase().includes(f.toLowerCase());
    })
  )
);
```

**Template structure:**
```html
<div class="table-wrapper">
  <table>
    <thead>
      <tr>
        {#each columns as col, i}
          <th>
            <span class="col-label">{col.label}</span>
            <input class="col-filter" type="text" placeholder="filter…"
              bind:value={filters[i]} aria-label="Filter by {col.label}" />
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each filteredItems as item}
        {@render row(item)}
      {/each}
    </tbody>
  </table>
</div>
```

**CSS notes:**
- Filter inputs: `background: transparent`, `border-bottom: 1px solid var(--border-color-dim)`, focus `var(--color-accent)`
- Column labels: `color: var(--color-accent)`, bold
- Use `:global(tbody tr)` and `:global(tbody td)` for structural defaults since snippet rows render in caller scope
- Always-visible filter inputs (no click-to-toggle) — simpler and more accessible
<!-- SECTION:IMPLEMENTATION_NOTES:END -->
