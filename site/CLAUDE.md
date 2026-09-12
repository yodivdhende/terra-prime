# Terra Prime — Project Context

## Architecture Conventions

### Frontend (`src/lib/`)

State management lives in **manager files** (`*.svelte.ts`), e.g. `window-manager.svelte.ts`.
- Use the function factory pattern with Svelte 5 runes (`$state`, `$derived`, etc.)
- Expose reactive values via getters
- Name files `<domain>-manager.svelte.ts`

### Backend (`src/lib/server/` or API routes)

No state management. Logic lives in **service files** (`*.service.ts`), e.g. `user.service.ts`.
- Pure functions or classes — no runes, no `$state`
- Name files `<domain>.service.ts`

> The naming makes the boundary explicit: **managers = frontend reactive state**, **services = backend business logic**.

### UI patterns

**"Add new" button above tables**: use a `CirclePlus` icon from `@lucide/svelte` as the trigger, placed above the `<table>` inside `<main>`. Color it `var(--color-accent)` with no border or background. Render it as an `<a>` when it links to a creation page (`src/routes/manage/events/+page.svelte`), or as a `<button>` when it adds an inline draft row to the same page (`src/routes/manage/events/[id]/budget/+page.svelte`). For inline drafts, keep a `drafts: Draft[]` `$state` array, append draft rows at the top of `<tbody>`, and on save call the upsert endpoint then `invalidateAll()`.

Terra Prime is a LARP / tabletop event management system. Players have characters that evolve across events; organizers manage events, expertise, items, and implants.

## Database

Schema lives in `src/lib/db/schema/` (Drizzle ORM), split by domain — `auth`, `catalog`,
`companies`, `characters`, `events`, plus `relations`. Import from `$lib/db/schema`, which
re-exports all of them. MySQL / InnoDB, utf8mb4.
Migrations are generated into `drizzle/`; see `docs/database-migrations.md`.
Tables and columns are PascalCase, so each column names its database column explicitly and
exposes a camelCase TypeScript property. Repositories in `src/lib/db/*.repo.ts` query through
the shared `db` client from `src/lib/db/mysql.ts` — no raw SQL.

### Users & Auth

| Table | Key columns | Notes |
|---|---|---|
| `Users` | `Id`, `Name`, `Email`, `Password` | Registered players and organizers |
| `Admins` | `UserId` → Users | Marks a user as admin |
| `Sessions` | `Token` (PK), `UserId`, `Description`, `Start`, `End` | Auth sessions |
| `Session_Roles` | `Token` → Sessions, `Role` | Roles granted to a session (e.g. `admin`) |

### Characters

| Table | Key columns | Notes |
|---|---|---|
| `Characters` | `Id`, `Name`, `Owner` → Users | A player's character |
| `Character_Versions` | `Id`, `Character` → Characters, `Name` | Snapshot of a character (e.g. per event) |
| `Character_Version_Expertise` | `Id`, `CharacterVersion`, `Expertise` → Expertise, `Value` | Expertise levels for a version |
| `Character_Version_Items` | `Id`, `CharacterVersion`, `Item` → Items, `Count` | Inventory for a version |
| `Character_Version_Implants` | `Id`, `CharacterVersion`, `Implant` → Implants | Implants for a version |

### Reference / Catalog

| Table | Key columns | Notes |
|---|---|---|
| `Expertise_Groups` | `Id`, `Name`, `Description` | Category grouping for expertise |
| `Expertise` | `Id`, `Group` → Expertise_Groups, `Name`, `Description` | Individual expertise entries |
| `Items` | `Id`, `Name`, `Description` | Equippable items |
| `Implants` | `Id`, `Name`, `Description` | Cybernetic / special implants |

### Events & Social

| Table | Key columns | Notes |
|---|---|---|
| `Events` | `Id`, `Name`, `StartTime`, `EndTime`, `Status` | Status: `Draft` / `Open` / `Live` / `Canceled` |
| `Event_Participants` | `Event` → Events, `User` → Users, `CharacterVersion` → Character_Versions | Which character version a user plays at an event |
| `Party` | `Id`, `Name` | A group of characters |
| `Party_Members` | `Party` → Party, `Member` → Characters | Characters in a party |
| `Messages` | `Id`, `Sender` → Users, `Recipient` → Users, `Subject`, `Message`, `Attachment` (JSON) | In-game or out-of-game messages; `Sender` nullable (system messages) |

### Missions & devices

| Table | Key columns | Notes |
|---|---|---|
| `Missions` | `Id`, `Name`, `PlayerLimit`, `Status`, `CreatedAt` | Status: `open` / `closed`. `PlayerLimit` 0 means no limit. **No print pool column** |
| `Mission_Participants` | `Mission` → Missions, `CharacterVersion` → Character_Versions, `AvailablePrints`, `RegisterAt` | PK `(Mission, CharacterVersion)`; the player is derived via `CharacterVersion → Character → Owner` |
| `Mission_Printer` | `Mission` → Missions, `Device` → Devices | PK `(Mission, Device)`; association only |
| `Devices` | `Id`, `Name`, `Uid` | Minimal registry created by `0020_missions.sql`; the device epic extends it |
| `Device_Printer` | `Device` → Devices, `PrintsAvailable` | The printer role of a device |

> A mission owns no print pool. Its available prints are
> `SUM(Device_Printer.PrintsAvailable)` across the printers in `Mission_Printer`,
> so attaching or detaching a machine changes the number with no `Missions` row edited.
