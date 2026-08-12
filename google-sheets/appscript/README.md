# Terra Prime ↔ Google Sheets Apps Script

A container-bound Apps Script project that connects a Google Sheet directly to
the Railway-hosted `testaliceDB` MySQL database (see `../PLAN.md` for
background/prerequisites) using Apps Script's built-in `Jdbc` service. It adds
a sidebar for picking a table, loading it into the sheet, and pushing edits
back to the database with an **Update database** button.

## Files

| File | Purpose |
|---|---|
| `Code.gs` | Server-side logic: menu, sidebar, `Jdbc` connection, load/save |
| `Sidebar.html` | Sidebar UI: table picker, "Load" and "Update database" buttons |
| `appsscript.json` | Project manifest |

## Setup

1. Open the target Google Sheet → **Extensions → Apps Script**
2. Recreate the three files from this directory in the Apps Script editor
   (**+ → Script** for `Code.gs`, **+ → HTML** for `Sidebar.html`; enable
   **Show "appsscript.json" manifest file** in Project Settings to edit the
   manifest) and paste in their contents
3. In `Code.gs`, fill in `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` with the
   credentials from the Railway MySQL **Connect** tab — enable **Public
   Networking** first (see `../PLAN.md` → Prerequisites for the full
   walkthrough, including creating a restricted `sheets_user`)
4. Adjust the `TABLES` map if your schema differs from `db/scripts/init.sql` —
   each entry lists the primary-key column(s) used to decide whether a sheet
   row becomes an `UPDATE` or an `INSERT` on save
5. Save, then reload the spreadsheet — a **Terra Prime** menu appears in the
   menu bar
6. **Terra Prime → Open sidebar**, and approve the authorization prompt on
   first run

## Using the sidebar

- **Table to display** — pick any configured table and click **Load table
  into sheet** to pull its current contents into a same-named sheet
  (overwriting that sheet if it already exists)
- **Update database** — diffs the *active* sheet (whichever tab you're on)
  against its matching table: rows whose primary-key cell(s) match an
  existing row are `UPDATE`d, all other rows are `INSERT`ed. Runs inside a
  single transaction, so a failure rolls back and leaves the database
  untouched

## Security

- Use a dedicated `sheets_user` granted only `SELECT, INSERT, UPDATE` (see
  `../PLAN.md`) — never the application's admin credentials
- Don't share the sheet with anyone who shouldn't be able to write to the
  database — the sidebar can write to any table listed in `TABLES`
