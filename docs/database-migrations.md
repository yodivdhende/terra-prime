# Database Migrations

The schema is defined in TypeScript under `site/src/lib/db/schema/` using [Drizzle ORM](https://orm.drizzle.team/). Migrations are generated from it by `drizzle-kit` into `site/drizzle/`, and applied by `site/db/migrate.ts`.

Drizzle is also the data layer: every repository in `site/src/lib/db/*.repo.ts` builds its queries from the same schema, so a column rename shows up as a type error rather than a runtime surprise.

### Schema modules

`site/src/lib/db/schema/` is split by domain, with `index.ts` re-exporting everything — import from
`$lib/db/schema` and you get the whole schema regardless of which module a table lives in.

| module          | contents                                                     |
|-----------------|--------------------------------------------------------------|
| `enums.ts`      | column enum values shared between modules                    |
| `auth.ts`       | users, admins, sessions, messages, e-mail tokens             |
| `catalog.ts`    | expertise (+groups, point costs), items, implants            |
| `companies.ts`  | companies and their discount tables                          |
| `characters.ts` | characters, versions, version contents, access grants, party |
| `events.ts`     | events, participants, coupons                                |
| `relations.ts`  | relations for the relational query API                       |

Modules import in one direction only — `auth`/`catalog` → `companies` → `characters` → `events` —
which matches the foreign-key graph and keeps the module graph acyclic. `relations.ts` is the one
exception and is deliberately last: the relation graph *is* cyclic, but `relations()` takes a
callback, so those cross-references resolve lazily and never form a module-load cycle.

When adding a table, put it in the module that owns it and check the import direction still flows
one way. `drizzle.config.ts` points at `schema/index.ts`, so nothing else needs updating.

## How It Works

`pnpm migrate` (`site/db/migrate.ts`) does the following on each run:

1. Bootstraps a database that already has the schema (see below)
2. Creates the `__drizzle_migrations` tracking table if it doesn't exist
3. Reads `site/drizzle/meta/_journal.json` and applies every migration newer than the last recorded one, in journal order
4. Records each applied migration by content hash and timestamp

Migrations are **append-only** — never edit a migration file that has been applied anywhere. Change the schema and generate a new one instead.

### The baseline migration

`site/drizzle/0000_baseline.sql` is a snapshot of the schema as the 21 hand-written `.sql` files that preceded Drizzle left it. Those files had duplicate sequence prefixes (`0003`, `0006`, `0010`, `0016` each appeared twice, `0012` was missing) and only worked because the old runner sorted them with `.sort()`. Drizzle's journal enforces a strict order, so the history was collapsed into one baseline rather than replayed. The originals remain in git history.

The baseline also carries the two `Email_Templates` rows that migrations `0003` and `0004` used to insert, so a fresh database still comes up with the `verify_email` and `password_reset` templates. That insert is written `ON DUPLICATE KEY UPDATE`, so it is safe to re-run.

### Bootstrapping an existing database

Dev, staging, and production were all built by the old runner and already have the full schema. Running the baseline against them would fail on the first `CREATE TABLE`, so `migrate.ts` detects this case — `Admins` exists but `__drizzle_migrations` is empty — and records the baseline as applied without executing it:

```
[boot]  0000_baseline (tables already exist, marked as applied)
Migrations complete. 1 applied.
```

A genuinely empty database skips that branch and runs the baseline normally. Either way the run is idempotent.

The old `_migrations` table is left untouched on live databases. Drop it by hand once the cutover is confirmed.

## Tracking Table

```sql
CREATE TABLE `__drizzle_migrations` (
  `id`         SERIAL PRIMARY KEY,
  `hash`       TEXT NOT NULL,
  `created_at` BIGINT
);
```

`created_at` is the journal timestamp of the migration, not the time it was applied; it is what Drizzle compares against to decide what still needs running.

To check what has been applied:

```sql
SELECT * FROM __drizzle_migrations ORDER BY created_at;
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

`site/drizzle.config.ts` reads the same five variables, so `drizzle-kit` talks to whichever database `pnpm migrate` would.

## Running via Docker

Migrations run automatically when starting the stack with Docker Compose. The startup order is:

```
db (healthy) → migrate (exits 0) → sveltekit (starts)
```

The `migrate` service uses the `migrate-runner` build target. It exits after all migrations complete — if it fails, `sveltekit` will not start.

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

1. Edit the relevant module under `site/src/lib/db/schema/` — add the table, column, or index
2. Generate the migration:

```bash
pnpm exec drizzle-kit generate --name add_user_avatar
```

   This diffs the schema against `site/drizzle/meta/` and writes a numbered `.sql` file plus an updated snapshot and journal entry. It does not need a database connection.

3. Read the generated SQL before committing it. `drizzle-kit` is conservative but a rename it cannot infer comes out as a drop plus an add, which loses data — edit the file to an `ALTER TABLE ... CHANGE COLUMN` in that case.
4. Apply it with `pnpm migrate` (or `docker compose run --rm migrate`)
5. Commit the schema change, the new `.sql` file, and everything under `site/drizzle/meta/` together — the journal and snapshot are what make the next `generate` correct

For a data-only change (a backfill, a lookup row), write the `.sql` by hand in `site/drizzle/`, add a matching journal entry, and keep it idempotent.

### Inspecting a live database

```bash
pnpm exec drizzle-kit pull    # write a flat schema read back from the database
pnpm exec drizzle-kit check   # look for collisions in the journal
```

`pull` writes `site/drizzle/schema.ts` and `site/drizzle/relations.ts` — it does **not** touch
`site/src/lib/db/schema/`. Treat its output as a scratch file to diff against, not as a
replacement: it is one flat file, and it does not carry the comments or the hand-pinned index and
constraint names that the real schema depends on.

### Column naming

Tables and columns are PascalCase (`Character_Versions`, `BackstoryId`); the TypeScript properties are camelCase. Every column therefore names its database column explicitly:

```ts
export const characters = mysqlTable('Characters', {
	id: int('Id').autoincrement().primaryKey(),
	backstoryId: varchar('BackstoryId', { length: 128 })
});
```

Do not add a `casing` convention to `drizzle.config.ts` — the mapping is not mechanical (`Character_Versions.Character` is a foreign key exposed as `characterId`, and the index on `Character_Version_Expertise.Expertise` is still named `Skill` from before the rename).

## Seeds

Seed data lives in `site/db/seeds/` as typed TypeScript modules, one per table, each exporting rows typed against the schema:

```
site/db/seeds/
  index.ts                    # insert order, foreign-key safe
  users.ts
  characters.ts
  events.ts
  ...
  expertise-icons.data.ts     # SVG icon markup, referenced by expertise*.ts
```

Because each module is typed as `(typeof table.$inferInsert)[]`, a schema change that invalidates the seed data fails `pnpm check` instead of failing at runtime.

`pnpm seed` is **destructive**. It drops every table in the database, replays the migrations to rebuild the schema, then inserts the development dataset:

```bash
pnpm seed
```

Foreign-key checks are disabled for the whole run, because `Characters`, `Character_Versions`, and `Party` reference each other in a cycle that no single insert ordering satisfies during a full rebuild.

To add seed data for a new table, add a module under `site/db/seeds/`, then register it in the `steps` array in `site/db/seeds/index.ts` at a position where its foreign keys already exist.
