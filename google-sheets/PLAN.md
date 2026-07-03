# Google Sheets ↔ Terra Prime (Railway MySQL)

Connect your Railway-hosted `testaliceDB` MySQL database to Google Sheets using Google Apps Script's
built-in JDBC service — no extra API or backend changes needed.

---

## Overview

Google Apps Script includes a `Jdbc` service that can open a direct TCP connection to MySQL.
The script adds a custom menu to a Google Sheet, letting you pull any table into a sheet and push
edits back to the database.

---

## Prerequisites

### 1. Enable Railway public networking

1. Open your Railway project dashboard
2. Select the **MySQL** service
3. Go to **Settings → Networking** and enable **Public Networking**
4. Copy the generated **host**, **port**, **user**, and **password** from the **Connect** tab

### 2. (Recommended) Create a dedicated MySQL user

Avoid using your root/admin credentials in the script. Create a limited user:

```sql
CREATE USER 'sheets_user'@'%' IDENTIFIED BY 'StrongPassword123!';
GRANT SELECT, INSERT, UPDATE ON testaliceDB.* TO 'sheets_user'@'%';
FLUSH PRIVILEGES;
```

---

## How the script works

The script uses `Jdbc.getConnection(url, user, pass)` to open a MySQL connection and runs queries
via `PreparedStatement` to prevent SQL injection.

### Menu items

| Menu item              | What it does                                                                 |
| :--------------------- | :--------------------------------------------------------------------------- |
| **Load table → sheet** | Shows a dropdown of all tables; pulls selected table into a named sheet      |
| **Save sheet → DB**    | Diffs the sheet against the DB; runs `INSERT`/`UPDATE` inside a transaction  |
| **Reload current sheet** | Re-fetches the table for the active sheet                                 |
| **Load ALL tables**    | Loads every table into its own sheet in one go                               |

### Tables included

`Users`, `Characters`, `Skills`, `Skill_Groups`, `Implants`, `Items`, `Events`,
`Event_Participants`, `Party`, `Party_Members`, `Messages`, `Admins`

---

## Setup steps

1. Open a **Google Sheet** → `Extensions → Apps Script`
2. Delete the default `myFunction` stub
3. Paste the contents of `Code.gs` (to be created alongside this file)
4. Fill in the four config variables at the top of the script:

   ```js
   const DB_HOST = 'YOUR_RAILWAY_HOST';  // e.g. "containers-us-west-1.railway.app"
   const DB_PORT = 'YOUR_RAILWAY_PORT';  // e.g. "7777"
   const DB_USER = 'sheets_user';
   const DB_PASS = 'StrongPassword123!';
   ```

5. **Save** (`Ctrl+S`) and close the Apps Script editor
6. **Refresh** the Google Sheet — the **Terra Prime** menu will appear in the menu bar
7. On first use, Google will ask you to authorize the script — approve it

---

## Security notes

- **Never share the sheet publicly** — anyone with edit access can overwrite your database
- Use the dedicated `sheets_user` with `SELECT, INSERT, UPDATE` only — no `DELETE` or `DROP`
- Credentials are stored in the Apps Script project properties; keep the script project private
- Consider IP allowlisting on Railway if you want to restrict access further
