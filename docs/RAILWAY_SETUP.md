# Railway Setup

## Prerequisites

- A [Railway](https://railway.app) account
- This repository pushed to GitHub

---

## 1. Create a New Project

1. Go to [railway.app](https://railway.app) and click **New Project**
2. Select **Deploy from GitHub repo** and connect your repository

---

## 2. Add a MySQL Database

1. Inside your project, click **+ New** → **Database** → **MySQL**
2. Railway will provision a MySQL instance and automatically inject the following environment variables into all services in the project:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

No manual configuration is needed — the app and migration runner both read these variables.

---

## 3. Configure the App Service

### Root directory

If Railway auto-detected the wrong root, set it to `site/` in the service settings under **Source** → **Root Directory**.

### Build command

Railway will use the `Dockerfile` at `site/dockerfile` automatically. No changes needed.

### Deploy command

Set this in **Settings** → **Deploy** → **Deploy Command**:

```
pnpm migrate
```

This runs before the app starts on every deploy. It applies any unapplied migration files from `site/db/migrations/` and exits non-zero on failure (which aborts the deploy, keeping the previous version live).

---

## 4. Deploy

Push to your main branch (or trigger a manual deploy). Railway will:

1. Build the Docker image
2. Run `pnpm migrate` — connects to the MySQL service and applies any pending migrations
3. Start the app with `pnpm start`

Check the deploy logs to confirm the migration output, e.g.:

```
[run]  0001_initial_schema.sql
[done] 0001_initial_schema.sql
Migrations complete.
```

---

## Adding Migrations

To make a schema change:

1. Create a new file in `site/db/migrations/` following the naming convention:
   ```
   0002_your_description_here.sql
   ```
2. Write your SQL (one logical change per file)
3. Commit and push — the next Railway deploy will apply it automatically

The migration runner tracks applied files in a `_migrations` table in the database, so each file is only ever executed once.

---

## Local Development

The app connects to a local MySQL container by default (credentials fall back to the values in `compose.yml` when the `MYSQL*` env vars are not set).

To reset and re-apply the schema locally:

```sh
# Start the database container
docker compose up -d db

# Apply migrations
cd site && pnpm migrate

# Load dev seed data (optional)
pnpm seed
```
