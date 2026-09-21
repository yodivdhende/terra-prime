# API Routes

All handlers use `handleRequest()` for error handling and extract tokens via `getSessionToken(cookies)` or the `authentication` header.

## Auth helpers

- `authGuard(token, roles)` — validates token, throws 403 if missing required role
- `authGuardForUser(token, roles)` — same, but also returns `{ userId, roles }` for downstream use
- Roles: `'admin'` | `'user'`
- Numeric path params validated via `isNumberOrError(param)`

All responses are JSON unless explicitly noted (file streams, HTML, `204 No Content`).

---

## Authentication

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| POST | `/api/authentication/register` | Public | `{ userId: number, roles: string[] }` (JSON) | Register new user; sets session cookie |
| POST | `/api/authentication/login` | Public | `{ token: string, roles: string[], name: string }` (JSON) | Login with `{ email, password }`; sets session cookie |
| POST | `/api/authentication/login/token` | Public | `{ token: string }` (JSON) | Set session cookie from existing token `{ token }` |
| POST | `/api/authentication/verify-email` | Public | `{ ok: true, userId: number }` (JSON) | Consume a verification token; body: `{ token: string }`. Returns 400 if invalid/expired |
| POST | `/api/authentication/verify-email/resend` | user/admin | `{ ok: true }` (JSON) | Resend verification email to the current session user. Returns 400 if already verified |
| POST | `/api/authentication/forgot-password` | Public | `{ ok: true }` (JSON) | Request a password reset email; body: `{ email: string }`. Always returns 200 even when the email is unknown (no enumeration) |
| POST | `/api/authentication/reset-password` | Public | `{ ok: true, userId: number }` (JSON) | Consume a password reset token and update the user's password; body: `{ token: string, password: string }`. Returns 400 for invalid/expired token or password shorter than 8 characters |

---

## Email & Admin

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| POST | `/api/admin/emails/send` | admin | `{ ok: true }` (JSON) | Send any template to any recipient; body: `{ to: string, templateKey: string, link?: string }`. Throws 400 for unknown template keys |
| POST | `/api/admin/users/[id]/resend-verification` | admin | `{ ok: true }` (JSON) | Resend verification email to a specific user. Returns 400 if already verified |
| POST | `/api/admin/users/[id]/send-password-reset` | admin | `{ ok: true }` (JSON) | Send a password reset email to a specific user |

---

## Email Templates

Templates are `{ id, key, docUrl }` rows. `docUrl` is a Google Doc URL whose HTML is fetched via the Drive service at send-time. Subjects are hardcoded per `key` in `src/lib/server/email.service.ts`. Templates support a literal `[[LINK]]` marker that is replaced (HTML-escaped) when a `link` is provided to the sender.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/email-templates` | admin | `EmailTemplate[]` (JSON) — `EmailTemplate = { id: number \| null, key: string, docUrl: string }` | List all templates |
| PUT | `/api/email-templates` | admin | `{ id: number }` (JSON) | Upsert template; body: `EmailTemplate`. Insert when `id` is null, update otherwise |
| GET | `/api/email-templates/[id]` | admin | `EmailTemplate` (JSON; 404 if not found) | Get template by ID |
| POST | `/api/email-templates/[id]` | admin | empty body (200) | Update template; body: `EmailTemplate` |
| DELETE | `/api/email-templates/[id]` | admin | empty body (200) | Delete template |

---

## Sessions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/sessions` | admin | `Session[]` (JSON) | List all sessions |
| POST | `/api/sessions` | admin | `string` (JSON-encoded token) | Create session; body: `NewSession` |
| DELETE | `/api/sessions/[token]` | admin | empty body (200) | Delete session by token |

---

## Users

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/users` | admin | `User[]` (JSON) | List all users |
| GET | `/api/users/[id]` | admin | `User` (JSON) | Get user by ID |
| POST | `/api/users/[id]` | admin | empty body (200) | Update user; body: `User` (raw, no wrapper) |

---

## Expertise

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
Expertise has no per-entry cost. Every expertise shares the same cost curve, defined by a global, admin-editable point-cost table (`Expertise_Point_Costs`, points 0-100) of sparse breakpoints — `(point, cost)` rows where `cost` is the **cumulative total cost** of reaching that point. Admins can freely add/remove breakpoint rows (e.g. the default seed is a single row, `100 -> 1000`); the cost at a point between two breakpoints is linearly interpolated (an implicit `0 -> 0` breakpoint is assumed below the lowest row, and the curve holds flat past the highest row). With no company discount, the total cost of a character's expertise at level `N` is this interpolated lookup. With a discount, each point's cost is derived as the difference between the interpolated totals at consecutive levels, the discount (a percentage, 0-100) is applied to that derived per-point cost and floored, and the discounted per-point costs are summed `1..N` — see `computeCharacterVersionCost` in `src/lib/server/budget.service.ts` and the shared helpers in `src/lib/utils/point-cost.ts` and `src/lib/utils/discount.ts`. Company discounts on items and implants are likewise percentages (0-100), applied as `floor(price * (1 - discount/100))` — see `Company_Discounts_Items`/`Company_Discounts_Implants`/`Company_Discounts_Expertise` and `src/lib/db/company_discounts.repo.ts`.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/expertise` | admin/user | `Expertise[]` (JSON) — `Expertise = { id: number \| null, name: string, description: string, groupId: number, groupName: string, icon?: string \| null, groupIcon?: string \| null, groupColor?: string \| null }`. `icon` is this expertise's own SVG; `groupIcon`/`groupColor` are read-only, joined from the parent group. Icons are sanitized on write. | List all expertise |
| PUT | `/api/expertise` | admin | empty body (200) | Create/update expertise; body: `Expertise` |
| GET | `/api/expertise/[id]` | admin | `Expertise` (JSON) | Get expertise by ID |
| POST | `/api/expertise/[id]` | admin | empty body (200) | Update expertise; body: `Expertise` |
| DELETE | `/api/expertise/[id]` | admin | empty body (200) | Delete expertise |
| GET | `/api/expertise/point-costs` | admin/user | `ExpertisePointCost[]` (JSON) — `ExpertisePointCost = { point: number, cost: number }`, a sparse set of breakpoint rows (point 0-100); `cost` is the cumulative total cost of reaching that point, interpolated between rows elsewhere | List the shared expertise point-cost breakpoints |
| PUT | `/api/expertise/point-costs` | admin | empty body (200) | Replace the point-cost breakpoints wholesale; body: `ExpertisePointCost[]`. Admin can add, edit, or remove rows freely |
| GET | `/api/expertise/groups` | admin/user | `ExpertiseGroup[]` (JSON) — `ExpertiseGroup = { id: number \| null, name: string, description: string, icon?: string \| null, color?: string \| null }`. `icon` is the group's SVG (sanitized on write); `color` is a `#rrggbb` hex string (validated on write, else stored null). | List all expertise groups |
| PUT | `/api/expertise/groups` | admin | empty body (200) | Create/update expertise group; body: `ExpertiseGroup` |
| GET | `/api/expertise/groups/[id]` | admin | `ExpertiseGroup` (JSON) | Get expertise group by ID |
| POST | `/api/expertise/groups/[id]` | admin | empty body (200) | Update expertise group; body: `ExpertiseGroup` |
| DELETE | `/api/expertise/groups/[id]` | admin | empty body (200) | Delete expertise group |

---

## Items

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/items` | admin/user | `Item[]` (JSON) — `Item = { id: number \| null, name: string, description: string, cost?: number }` | List all items |
| PUT | `/api/items` | admin | empty body (200) | Create/update item; body: `Item` |
| GET | `/api/items/[id]` | admin | `Item` (JSON) | Get item by ID |
| POST | `/api/items/[id]` | admin | empty body (200) | Update item; body: `Item` |
| DELETE | `/api/items/[id]` | admin | empty body (200) | Delete item |
| POST | `/api/items/bulk` | admin | empty body (200) | Bulk update items; body: `Item[]` |

---

## Implants

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/implants` | admin/user | `Implant[]` (JSON) — `Implant = { id: number \| null, name: string, description: string, cost?: number }` | List all implants |
| PUT | `/api/implants` | admin | empty body (200) | Create/update implant; body: `Implant` |
| GET | `/api/implants/[id]` | admin | `Implant` (JSON) | Get implant by ID |
| POST | `/api/implants/[id]` | admin | empty body (200) | Update implant; body: `Implant` |
| DELETE | `/api/implants/[id]` | admin | empty body (200) | Delete implant |
| POST | `/api/implants/bulk` | admin | empty body (200) | Bulk update implants; body: `Implant[]` |

---

## Characters

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/characters` | admin | `Character[]` (JSON) | List all characters |
| PUT | `/api/characters` | admin/user | `{ id: number \| undefined }` (JSON) | Create character; body: `NewCharacter` |
| GET | `/api/characters/[characterId]` | admin/user | `Character` (JSON) | Get character by ID |
| POST | `/api/characters/[characterId]` | admin/user | empty body (200) | Update character; body: `Character \| NewCharacter` |
| GET | `/api/characters/[characterId]/events/[eventId]` | user | `{ characterVersion: CharacterVersionBare \| undefined }` (JSON) | Get the character version used for a specific event |
| POST | `/api/characters/experience` | admin/user/device | `CharacterExperienceResponse` (JSON) — `{ characterId, characterName, ownerName, eventId, eventName, versionId, versionName, expertise: VersionExpertise[] }` | Resolve a character by name to its expertise for the version registered to the **latest event with status `Live`** (most recent `start`, ties broken by highest `id`). Body: `{ name: string }`. 404 if there is no live event, no character named `name`, or the character is not registered for the live event; 400 if multiple characters share that name |

### Character Versions

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| PUT | `/api/characters/versions` | user | `{ id: number }` (JSON) | Create character version; body: `CharacterVersionBare` |
| GET | `/api/characters/versions/[versionId]` | user | `CharacterVersionBare \| null` (JSON; null when not found) | Get character version by ID |
| PUT | `/api/characters/versions/[versionId]` | user | `number` (JSON-encoded id) | Update character version; body: `CharacterVersionBare` |
| DELETE | `/api/characters/versions/[versionId]` | admin | empty body (200) | Delete character version and its expertise/items/implants |
| GET | `/api/characters/versions/[versionId]/full` | user | `CharacterVersionFull` (JSON) | Get full version detail, with expertise/items/implants resolved to catalog entries |
| PUT | `/api/characters/versions/[versionId]/expertise` | user | empty body (200) | Replace version expertise; body: `CharacterVersionExpertise[]` |

---

## Events

Event dates (`start`, `end`) are sent as ISO strings and converted to `Date` objects before validation. `LarpEvent` also carries `formId?: string | null` — the bare Google Form ID (no URL) attached to this event — and `sheetId?: string | null` — the linked Google Spreadsheet ID for responses (server-assigned, not set by the admin UI). Saving an event with `formId` set and `sheetId` null eagerly creates the response spreadsheet in Drive folder `1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J` and persists its ID.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events` | admin | `LarpEvent[]` (JSON) | List all events |
| PUT | `/api/events` | admin | empty body (200) | Create event; body: `LarpEvent` (dates as ISO strings) |
| GET | `/api/events/open` | admin/user | `LarpEvent[]` (JSON) | List events with status `Open` |
| GET | `/api/events/[eventId]` | admin/user | `LarpEvent` (JSON; 404 if not found) | Get event by ID |
| POST | `/api/events/[eventId]` | admin | empty body (200) | Update event; body: `LarpEvent` (dates as ISO strings) |
| DELETE | `/api/events/[eventId]` | admin | empty body (200) | Delete event |

### Event Participants

An event has two kinds of attendee, held in two tables. `Event_Players` (renamed from
`Event_Participants`) keeps its `(Event, User)` key: the one character version a **player** builds
and plays. `Event_Extras` holds **extras** — crew / NPC actors who do not build a character — with
many rows per `(Event, User)` and a null `CharacterVersion` until an admin assigns one. Which table
a row is in *is* the signup type; there is no discriminator column. Characters carry a
`kind: 'player' | 'npc'`, and the endpoints below refuse the wrong one rather than crossing over.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events/[eventId]/participants` | admin | `Character[]` (JSON) — repo returns the characters playing in this event | List all players for event |
| PUT | `/api/events/[eventId]/participants` | admin | empty body (200) | Register a participant; body: `CharacterWithVersions` (`{ id: number \| null, name, ownerId, ownerName, versions: CharacterVersionBare[] }`). Creates the character when `id` is null, otherwise updates it; then creates/updates the **last** entry in `versions` (create when its `id` is null) and registers that version for the event under `ownerId` |
| POST | `/api/events/[eventId]/participants` | admin | empty body (200) | Attach an **existing** character version to the event; body: `{ characterVersionId: number }`. The owner is derived from the version server-side. Returns 404 when the version is unknown, and 400 when that owner already participates in this event (`Event_Players` is keyed on (Event, User)) or when the version's character has `kind: 'npc'` — those go through the extras endpoint |
| DELETE | `/api/events/[eventId]/participants` | admin | empty body (200) | Remove player; body: `EventPlayer` (`{ eventId, userId, characterVersion }`) |
| GET | `/api/events/[eventId]/participants/characters/[characterId]` | user | `EventAttendance \| null` (JSON; null when not found) | Get the attendance record for a specific character at this event: `{ eventId, userId, characterVersion, as: 'player' \| 'extra' }`. Checks both tables, so an NPC assigned to an extra resolves here exactly as a player character does |

### Event Extras

Admin-only. An extra accumulates characters: `PUT` fills the empty row an enrolment leaves behind
and inserts a new row after that, so one extra may hold several NPC versions at one event.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events/[eventId]/extras` | admin | `EventExtra[]` (JSON) — `{ id, userId, userName, characterVersionId, characterVersionName, characterId, characterName }`; the character fields are null for an extra with nothing assigned yet | List the extras enrolled for this event and the versions they hold |
| POST | `/api/events/[eventId]/extras` | admin | empty body (200) | Enrol a user as an extra; body: `{ userId: number }`. Idempotent for an already-enrolled user |
| PUT | `/api/events/[eventId]/extras` | admin | empty body (200) | Assign an NPC version to an extra; body: `{ userId: number, characterVersionId: number }`. 404 when the version is unknown; 400 when its character is not `kind: 'npc'`, or when the user is not enrolled as an extra here |
| DELETE | `/api/events/[eventId]/extras` | admin | empty body (200) | Unassign one version, or remove the extra and every assignment when `characterVersionId` is omitted; body: `{ userId: number, characterVersionId?: number }` |

### Event Coupons

A coupon is a discrete grant tied to one user and one event. Multiple coupons may exist per (event, user) pair. Only `type: 'budget'` is implemented today; a coupon's value only counts toward budget once redeemed (see `PUT /api/my/events/[eventId]/participants` below).

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events/[eventId]/coupons` | admin | `EventCoupon[]` (JSON) — `{ id, userId, userName, code, type: 'budget', value, redeemed }` | List all coupons for event |
| POST | `/api/events/[eventId]/coupons` | admin | `{ id: number, code: string }` (JSON) | Create a coupon; body: `{ userId: number, value: number }`. Server generates a short redeemable `code` |
| DELETE | `/api/events/[eventId]/coupons/[couponId]` | admin | empty body (200) | Delete a coupon |

### Event Budget

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events/[eventId]/budget/characters/[characterId]` | admin/user | `{ budget: number }` (JSON) | Total available budget for a character at an event: `event.budget + priorRewardBudget + sum(redeemed 'budget' coupons for the character's owner at this event)` |
| GET | `/api/my/events/[eventId]/coupons/[code]` | user | `{ valid: boolean, value: number }` (JSON, always 200) | Check whether `code` is an unredeemed 'budget' coupon for the current user at this event, without redeeming it. Used to preview the budget effect of a coupon before final registration submit |

`PUT /api/my/events/[eventId]/participants` (see "My" section) now also accepts an optional `couponCode?: string | null` on the body. If provided, it must match an unredeemed coupon for the current user at this event or the request is rejected with 400 (`invalid or already used coupon code`). The endpoint also recomputes the submitted character version's total cost server-side and rejects with 400 (`character exceeds available budget`) if it exceeds the available budget (including the coupon being redeemed, if any). On success, a matched coupon is marked redeemed.

---

## Devices

A device is a `{ id, name, uid }` row and nothing more; `uid` is unique and is the identity the
hardware presents — what a Port emits on the wire, or what an MQTT client announces itself as.
What a device *is* lives in its roles, which are their own sub-resource. A device may hold several
roles at once, and a device with none is unclassified — that is legal, and is what a freshly
registered UID looks like.

`DeviceRole` is a discriminated union on `role`:

| `role` | fields | meaning |
|---|---|---|
| `port` | — | A Port. Being one is the whole of it: a Port carries no configured behaviour, and what happens when an AguesGuard docks with it is decided by whoever subscribes to the resulting `port.connected` / `port.disconnected` facts |
| `aguesguard` | `characterVersionId` | The handheld, and the character version loaded onto it |
| `game` | `portDeviceId` | The Port this game watches. The referenced device must itself hold the `port` role |
| `printer` | `printsAvailable` | Feeds `Mission_Printer` — a mission's available prints are the sum over its attached printers |
| `light` | `endpoint`, `fixture` | |

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/devices` | admin | `Device[]` (JSON) — `Device = { id: number, name: string, uid: string, roles: DeviceRole[] }` | List all devices with their roles |
| PUT | `/api/devices` | admin | `{ id: number }` (JSON) | Create a device, optionally with its initial roles in the same request; body: `{ name, uid, roles?: DeviceRole[] }`. Attaching the roles is atomic with the create — if any role is invalid the whole request 400s and no device is created. 400 when `uid` is already registered, when a role entry is malformed, when an `aguesguard`'s character version does not exist, when a `game`'s port is not a Port, or when a game would watch itself |
| GET | `/api/devices/ports` | admin | `{ id, name, uid }[]` (JSON) | Every device holding the `port` role — what the Game role's picker is filled from |
| GET | `/api/devices/[id]` | admin | `Device` (JSON; 404 if not found) | Get a device and its roles |
| POST | `/api/devices/[id]` | admin | empty body (200) | Update name/uid; body: `{ name, uid }`. 400 when `uid` belongs to another device |
| DELETE | `/api/devices/[id]` | admin | empty body (200) | Delete a device. Its role rows go with it, any Game watching it as a Port loses that role, and it is detached from every mission it printed for |

### Device roles

One endpoint per role, addressed by name: `/api/devices/[id]/roles/[role]` where `role` is one of
`port` / `aguesguard` / `game` / `printer` / `light`. POSTing a role a device already holds edits
that role's fields in place, so the same call serves "make this a printer" and "change how many
prints it has". Both verbs return the full updated `Device`.

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| POST | `/api/devices/[id]/roles/[role]` | admin | `Device` (JSON) | Attach or update the role; body carries only that role's own fields (`port` takes none). 404 for an unknown role name or a missing device; 400 when the body is invalid, when an `aguesguard`'s character version does not exist, when a `game`'s port is not a Port, or when a game would watch itself |
| DELETE | `/api/devices/[id]/roles/[role]` | admin | `Device` (JSON) | Detach the role. Detaching a role the device does not hold is a no-op, not an error. 400 when detaching `port` while a Game still watches it |

A Port's UID is not set through this API at all: a standardized Arduino Nano is flashed once with
`arduino-nano-uid/`, and its UID is written afterwards over Web Serial from `manage/devices` —
browser to hardware, no server round-trip.

---

## Forms (Google Forms integration)

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/forms/[formId]` | Public | `GoogleForm` (JSON) | Fetch a Google Form's structure |

Form submission is no longer a public Forms-API call. It writes a row to the event's linked Google Sheet via `POST /api/my/events/[eventId]/form-submit` (see the "My" section). The sheet is created in workspace Drive folder `1fxhnT9gEr6CWyfBgGQ1ZWYoGkpLH4c-J` and its ID is stored on `Events.SheetId`.

---

## Drive (Google Drive integration)

All drive endpoints are public (no auth). Responses are non-JSON where noted.

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/api/drive/search?q=<query>` | `DriveFile[]` (JSON; `[]` if query < 2 chars) | Search Drive files |
| GET | `/api/drive/[fileId]` | `ReadableStream` — `Content-Type: application/pdf`, `Cache-Control: private, max-age=3600` | Stream file as PDF |
| GET | `/api/drive/[fileId]/dir` | `DriveFile[]` (JSON) | List files in a Drive folder |
| GET | `/api/drive/[fileId]/doc` | `string` — `Content-Type: text/html; charset=utf-8`, `Cache-Control: no-store` | Export Google Doc as HTML; black/white colors are inverted for dark-mode compatibility |

---

## My (current-user scoped)

All endpoints under `/api/my/...` operate on the authenticated user. Auth: `user` role unless stated otherwise. Use these instead of branching on roles inside a shared handler.

### The caller's own character version

Some `/api/my/**` reads answer for **one** character version — the one the caller is playing —
rather than listing everything they own. They accept two kinds of caller, resolved in
`src/lib/server/my-character.service.ts`:

- **a player**, by the `session-token` cookie (`user` role). `?characterVersionId=<id>` picks which
  of their versions to answer for; without it the newest owned version is used. A version the
  caller does not own answers 404, not 403, so the response does not say which ids exist.
- **an AguesGuard**, by an `X-Device-Uid` header carrying the UID it is registered under in
  `Devices`. The device asserts nothing about which character it shows: the server reads that from
  the device's `aguesguard` role, so the prop carries no player's session token. 401 for an unknown
  UID, 403 for a device without the `aguesguard` role, 404 when the bound version is gone.

The device header wins when both arrive. A UID is a bearer credential sent in the clear — the same
self-asserted device identity the WebSocket channel has; a per-device secret would close it and
does not exist yet.

`/api/my/expertise` sends `icon` and `groupIcon` as null to a device caller: they are multi-kilobyte
SVG documents an ESP32 can neither render nor afford to parse. `groupColor` is always sent, and is
what the device tints both its bars and its icons with.

A device gets its icons from its own SD card instead, as 24px LVGL A8 images exported from
`manage/expertise` and keyed on expertise/group id — so `id` in this response is what the firmware
builds an icon path from. No server route serves those files; the export is built in the admin's
browser (`src/lib/utils/icon-export.ts`).

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/api/my/user` | `User` (JSON) | Get the currently authenticated user |
| GET | `/api/my/character` | `MyCharacterResponse` (JSON) — `{ id, name, versionId, versionName, companyId }` | The single character version the caller is playing. This is what an AguesGuard fetches at boot |
| GET | `/api/my/expertise` | `MyExpertiseResponse` (JSON) — `{ characterId, characterName, versionId, versionName, expertise: VersionExpertise[] }`, ordered by group then name | The caller's own expertise with catalog names, values and icons — everything needed to draw a bar per entry |
| GET | `/api/my/implants` | `MyImplantsResponse` (JSON) — `{ characterId, characterName, versionId, versionName, implants: VersionImplant[] }`, ordered by slot then name | The caller's own implants with their descriptions |
| GET | `/api/my/characters` | `Character[]` (JSON) | List characters owned by the current user. `kind: 'npc'` rows are excluded — an admin's NPC pool is not a character they play |
| GET | `/api/my/characters/with-events` | `(Character & { events: Array<{ id: number, name: string }> })[]` (JSON) | List the current user's characters, each with an `events` array |
| GET | `/api/my/characters/versions` | `MyCharacterVersionsResponse` (JSON) — `{ characters: (Character & { versions: CharacterVersionFull[] })[], assignedCharacters: AssignedCharacterVersion[] }` where each version's `expertise`/`items`/`implants` are joined with the catalog and `events` is the list of events the version is registered for: `expertise: { id, name, group, groupName, value }[]`, `items: { id, name, description, count }[]`, `implants: { id, name, description }[]`, `events: { id, name }[]`. `assignedCharacters` holds the NPC sheets handed to this user as an extra — `CharacterVersionFull & { characterName: string, event: { id, name } }`, hydrated the same way but read-only, since the user does not own them | List the current user's characters with their versions, plus the NPC versions assigned to them as an extra |
| GET | `/api/my/events/[eventId]/participants` | `{ type: 'player', characterId: number, characterVersionId: number }` or `{ type: 'extra' }` (JSON, 200), or empty body (204 when not enrolled) | Get the current user's enrolment for an event, whichever kind it is |
| POST | `/api/my/events/[eventId]/participants` | `{ ok: true }` (JSON) | Sign up as an **extra**; body: `{ type: 'extra' }`. Writes one `Event_Extras` row with a null `CharacterVersion` — no character, no budget, no coupon. The organisers assign NPCs afterwards |
| PUT | `/api/my/events/[eventId]/participants` | `{ characterId: number }` (JSON) | Register/update the current user's character for an event as a **player**; rejects with 400 when the referenced character has `kind: 'npc'`. Body: `CharacterWithVersions & { couponCode?: string \| null }` (`{ id: number \| null, name, ownerId, ownerName, backstoryId?, versions: CharacterVersionBare[], couponCode? }`). Creates the character when `id` is null, otherwise updates it; saves the **last** entry in `versions` and registers it for the event. Rejects with 400 if `couponCode` doesn't match an unredeemed coupon for this user+event, or if the version's total cost exceeds the available budget (base + prior reward + redeemed coupons, including the one being redeemed). Marks a matched coupon redeemed on success |
| POST | `/api/my/events/[eventId]/form-submit` | `{ ok: true, status: 200 }` (JSON) | Append the current user's Google Form answers as a row in the event's linked spreadsheet. Body: `AnswerMap` (`Record<string, string \| string[]>` keyed by `questionId`). Returns 404 if the event has no `formId`. Row layout: `[ISO timestamp, userId, name, email, ...answers in form order]`. If the form's question titles no longer match the latest tab's header, a new `Responses <ISO>` tab is added to the same spreadsheet for the new schema |
