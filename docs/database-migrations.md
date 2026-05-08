# Database Migrations

Migrations are the single source of truth for the database schema. The `init.sql` file is no longer used — all schema changes go through migration files.

## How It Works

The migration runner (`site/db/migrate.ts`) does the following on each run:

1. Creates a `_migrations` tracking table if it doesn't exist
2. Reads all `.sql` files from `site/db/migrations/` in alphabetical order
3. Skips any file already recorded in `_migrations`
4. Executes unapplied files in order, recording each one on success

Migrations are **append-only** — never edit an existing migration file. Add a new one instead.

## Tracking Table

```sql
CREATE TABLE `_migrations` (
  `id`         INT NOT NULL AUTO_INCREMENT,
  `filename`   VARCHAR(255) NOT NULL UNIQUE,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
```

To check which migrations have been applied:

```sql
SELECT * FROM _migrations ORDER BY applied_at;
```

## Running Locally

Make sure your `.env` is configured (see below), then from the `site/` directory:

```bash
pnpm migrate
```

### Environment Variables

| Variable        | Default       | Description              |
|-----------------|---------------|--------------------------|
| `MYSQLHOST`     | `localhost`   | Database host            |
| `MYSQLPORT`     | `3307`        | Database port            |
| `MYSQLUSER`     | `yodi`        | Database user            |
| `MYSQLPASSWORD` | `Tester@123`  | Database password        |
| `MYSQLDATABASE` | `testaliceDB` | Database name            |

## Running via Docker

Migrations run automatically when starting the stack with Docker Compose. The startup order is:

```
db (healthy) → migrate (exits 0) → sveltekit (starts)
```

The `migrate` service uses the `migrate-runner` build target, which includes dev dependencies (specifically `tsx`). It exits after all migrations complete — if it fails, `sveltekit` will not start.

```bash
docker compose up
```

To run migrations manually against the Docker database without starting the full stack:

```bash
docker compose run --rm migrate
```

### Fresh Start

If you need to wipe the database and rerun all migrations from scratch:

```bash
docker compose down -v   # removes the DB volume
docker compose up
```

## Creating a New Migration

1. Create a new `.sql` file in `site/db/migrations/`
2. Name it using zero-padded sequence + description:

```
0002_add_user_avatar.sql
0003_drop_party_members.sql
```

3. Write idempotent SQL where possible (`IF NOT EXISTS`, `IF EXISTS`)
4. Run `pnpm migrate` (or `docker compose run --rm migrate`) to apply it

### Naming Convention

```
<sequence>_<short_description>.sql
```

- Sequence is zero-padded to 4 digits: `0001`, `0002`, etc.
- Description uses underscores, lowercase
- Files are applied in alphabetical (lexicographic) order, so the numeric prefix controls ordering

### Example Migration

```sql
-- 0002_add_user_avatar.sql
ALTER TABLE `Users`
  ADD COLUMN `AvatarUrl` varchar(512) DEFAULT NULL;
```

## Seeds

Seed files live in `site/db/seeds/` and mirror the table structure:

```
site/db/seeds/
  users.sql
  characters.sql
  events.sql
  ...
```

Seeds are **not** run by the migration runner. They are intended to populate development data via a separate `pnpm seed` command (requires `site/db/seed.ts` to be implemented).

To apply seeds manually against the running Docker database:

```bash
docker compose exec db mysql -u yodi -pTester@123 testaliceDB < site/db/seeds/users.sql
```
