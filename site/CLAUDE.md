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

Schema lives in `db/migrations/0001_initial_schema.sql`. MySQL / InnoDB, utf8mb4.

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
| `Subco` | `Id`, `Name`, `Company` → Companies, `BackstoryId` | A sub-company: a group of characters sharing one company and a background link |
| `Subco_Members` | `Subco` → Subco, `Member` → Characters | Characters in a subco |
| `Messages` | `Id`, `Sender` → Users, `Recipient` → Users, `Subject`, `Message`, `Attachment` (JSON) | In-game or out-of-game messages; `Sender` nullable (system messages) |
