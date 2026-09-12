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

| Method | Path | Auth | Returns | Description |
|--------|------|------|---------|-------------|
| GET | `/api/events/[eventId]/participants` | admin | `Character[]` (JSON) — repo returns the characters playing in this event | List all participants for event |
| PUT | `/api/events/[eventId]/participants` | admin | empty body (200) | Register a participant; body: `CharacterWithVersions` (`{ id: number \| null, name, ownerId, ownerName, versions: CharacterVersionBare[] }`). Creates the character when `id` is null, otherwise updates it; then creates/updates the **last** entry in `versions` (create when its `id` is null) and registers that version for the event under `ownerId` |
| DELETE | `/api/events/[eventId]/participants` | admin | empty body (200) | Remove participant; body: `EventParticipant` (`{ eventId, userId, characterVersion }`) |
| GET | `/api/events/[eventId]/participants/characters/[characterId]` | user | `EventParticipant \| null` (JSON; null when not found) | Get participation record for a specific character |

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
| PUT | `/api/devices` | admin | `{ id: number }` (JSON) | Create a device; body: `{ name, uid }`. 400 when `uid` is already registered |
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

| Method | Path | Returns | Description |
|--------|------|---------|-------------|
| GET | `/api/my/user` | `User` (JSON) | Get the currently authenticated user |
| GET | `/api/my/characters` | `Character[]` (JSON) | List characters owned by the current user |
| GET | `/api/my/characters/with-events` | `(Character & { events: Array<{ id: number, name: string }> })[]` (JSON) | List the current user's characters, each with an `events` array |
| GET | `/api/my/characters/versions` | `MyCharacterVersionsResponse` (JSON) — `{ characters: (Character & { versions: CharacterVersionFull[] })[] }` where each version's `expertise`/`items`/`implants` are joined with the catalog and `events` is the list of events the version is registered for: `expertise: { id, name, group, groupName, value }[]`, `items: { id, name, description, count }[]`, `implants: { id, name, description }[]`, `events: { id, name }[]` | List the current user's characters with their versions, each version's expertise/item/implant IDs resolved to full catalog entries plus the events the version is registered for |
| GET | `/api/my/events/[eventId]/participants` | `{ characterId: number, characterVersionId: number }` (JSON, 200) or empty body (204 when not registered) | Get the current user's participation for an event |
| PUT | `/api/my/events/[eventId]/participants` | `{ characterId: number }` (JSON) | Register/update the current user's character for an event; body: `CharacterWithVersions & { couponCode?: string \| null }` (`{ id: number \| null, name, ownerId, ownerName, backstoryId?, versions: CharacterVersionBare[], couponCode? }`). Creates the character when `id` is null, otherwise updates it; saves the **last** entry in `versions` and registers it for the event. Rejects with 400 if `couponCode` doesn't match an unredeemed coupon for this user+event, or if the version's total cost exceeds the available budget (base + prior reward + redeemed coupons, including the one being redeemed). Marks a matched coupon redeemed on success |
| POST | `/api/my/events/[eventId]/form-submit` | `{ ok: true, status: 200 }` (JSON) | Append the current user's Google Form answers as a row in the event's linked spreadsheet. Body: `AnswerMap` (`Record<string, string \| string[]>` keyed by `questionId`). Returns 404 if the event has no `formId`. Row layout: `[ISO timestamp, userId, name, email, ...answers in form order]`. If the form's question titles no longer match the latest tab's header, a new `Responses <ISO>` tab is added to the same spreadsheet for the new schema |
