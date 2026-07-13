# AguesGuard Design Document

> Design and data-flow reference for the **AguesGuard** LARP device and how it
> interacts with the terra-prime site. This is a **target design** document: it
> describes where the project is going and grounds every feature in what already
> exists in the repo, calling out what still needs building in
> [§7](#7-what-needs-building). Diagrams are [Mermaid](https://mermaid.js.org/) —
> edit the fenced code blocks directly and re-render (e.g. on
> [mermaid.live](https://mermaid.live)) to adjust them.

## 1. Overview

**AguesGuard** is the software project for the **CYD** ("Cheap Yellow Display")
used at a **LARP event**. Every player carries a **battery-powered CYD** to view
their own character stats during the game.

The CYD is a low-cost ESP32 development board with an integrated 320x240 ILI9341
TFT screen and an XPT2046 resistive touch controller (named after the well-known
RandomNerdTutorials hardware guide). In this repo, `cyd/` is a PlatformIO/Arduino
firmware project that turns one of these boards into a handheld player prop: it
renders the player's expertise, implants, messages and prints (lives), plays
server-commanded animations, and reacts in real time to events pushed from the
server.

The device is a **thin client**. All game logic, session state, and character
data live on the site (SvelteKit + MySQL); the CYD renders and relays. It is
powered by **two 18650 batteries** so it can run untethered for the length of an
event, and it drops into a power-save mode (waking on touch) to conserve charge.

Each player has a **personal SD card** carrying their session id, WiFi
configuration, and images to load (such as the expertise icons).

---

## 2. Feature list

Each feature below is tagged with its current state in the repo. **Exists** =
already present; **Needs building** = described here but not yet implemented (see
[§7](#7-what-needs-building)).

### 2.1 View expertise — *catalog exists; device view to build*
Expertise is displayed as **progress bars**. The catalog and per-character values
already exist server-side: `Expertise`, `Expertise_Groups`, and
`Character_Version_Expertise` (whose `Value` column maps directly onto a progress
bar); icons were added in `site/db/migrations/0016_add_expertise_icons.sql`. The
firmware screen exists but under the **old name "Skills"**
(`cyd/src/ui/ui_Skills.c`) — a rename to "Expertise" is pending. Today expertise
has only admin routes (`site/src/routes/manage/expertise/**`), so a player-facing
read path for the device still needs building.

### 2.2 View implants — *catalog exists; device view to build*
An overview of all the player's implants, each with its description. Backed by
`Implants` (`Id`, `Name`, `Description`) and `Character_Version_Implants`; slot
and prerequisite rules live in migrations `0009`/`0010`/`0014`. Firmware screen:
`cyd/src/ui/ui_Implants.c`. Admin routes exist at
`site/src/routes/manage/implants/**`.

### 2.3 Activate implant charges — *needs building (refactor)*
Some implants have **charges** the player can activate; **refresh (recharging) is
handled by the admins**, not by the player. There is **no charge concept anywhere
today**, so this touches the database, the implant repo/API, and the manage UI.

#### 2.3.1 Data model
Charges live at two levels, mirroring how implants already split catalog vs.
per-character data:

- **Catalog** — how many charges an implant *type* grants when full. Add to the
  `Implants` table, alongside the existing `Cost`:
  `MaxCharges INT NOT NULL DEFAULT 0` (`0` = not a charged implant).
- **Instance** — the charges left on the copy a specific player carries. Add to
  the per-character join `Character_Version_Implants`, alongside the existing
  `Slot`: `ChargesRemaining INT NOT NULL DEFAULT 0`.

New migration `site/db/migrations/0017_implant_charges.sql` (next free number —
`0016` is already used twice), in the same style as `0010_implant_slots.sql`:

```sql
ALTER TABLE `Implants`
  ADD COLUMN `MaxCharges` int NOT NULL DEFAULT 0;

ALTER TABLE `Character_Version_Implants`
  ADD COLUMN `ChargesRemaining` int NOT NULL DEFAULT 0;

-- Backfill: existing implant instances start full
UPDATE `Character_Version_Implants` cvi
  JOIN `Implants` i ON i.Id = cvi.Implant
  SET cvi.ChargesRemaining = i.MaxCharges;
```

#### 2.3.2 Repo / type touchpoints
In `site/src/lib/db/implants.repo.ts`:

- Add `maxCharges` to the `Implant` type and to the `isImplants` guard.
- Select `i.MaxCharges as maxCharges` in every read (`getAll`,
  `getAllForCharacter`, `getAllAccessibleToAll`, `getWithId`, `getWithIds`).
- Add `MaxCharges` to the column lists/values in `create`, `edit`, and
  `saveBulk`.
- Add instance methods (here or on `character_version.repo.ts`):
  `spendCharge(cviId)` — `UPDATE Character_Version_Implants SET ChargesRemaining
  = ChargesRemaining - 1 WHERE Id = ? AND ChargesRemaining > 0`; and
  `refreshCharges(...)` — reset `ChargesRemaining` to the implant's `MaxCharges`
  for a character version (the admin refresh; reuse the `setCharacterAccess`
  transaction pattern).

#### 2.3.3 Manage-page changes
- **Implant form** (`site/src/lib/components/implant-form.svelte`): add a
  "max charges" number input bound to `implant.maxCharges`, next to the existing
  cost field. It flows through the current save path unchanged — the `[id]` page's
  `save()` already POSTs the whole `implant` to `POST /api/implants/[id]`, which
  calls `implantRepo.save()`; once the type and repo carry `maxCharges`, no page
  or endpoint wiring changes are needed. The `new` form reuses the same
  component, so it gets the field for free.
- **Admin refresh control**: because refresh is an admin action, add a "refresh
  charges" control where admins manage a live player — the character-version view
  under `site/src/routes/manage/characters/[id]/**` and/or the live
  `manage/sessions` dashboard — calling a new admin endpoint (e.g.
  `POST /api/characters/:id/implants/refresh`) that runs `refreshCharges` to
  reset that character's implant instances to full.

#### 2.3.4 Activation flow (device)
On the device, activating a charge calls an authenticated runtime endpoint under
`site/src/routes/api/my/**` (scoped to the player's own session) that runs
`spendCharge`; the server pushes the updated count back so the Implants screen
re-renders. This is the device-side counterpart to the admin refresh.

### 2.4 Receive messages — *table exists; delivery to build*
Players are **notified when a new message arrives**. The `Messages` table already
exists (`Id`, `Sender` → Users (nullable, for system messages), `Recipient` →
Users (NOT NULL), `Subject` varchar(512), `Message` text, `Attachment` (JSON NOT
NULL)) in `site/db/migrations/0001_initial_schema.sql`, but there is **no API, no
site UI, and no notification path** on top of it. Building it touches the
database, a new repo/API, and a new admin **send-message** manage page.

#### 2.4.1 Data model
The table is missing what delivery needs — a **read flag** (to drive the
"notify on new / unread" behaviour) and a **timestamp** (to order the list).
New migration `site/db/migrations/0018_message_delivery.sql` (after the
`0017` implant-charges migration):

```sql
ALTER TABLE `Messages`
  ADD COLUMN `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN `ReadAt`    datetime NULL DEFAULT NULL;   -- NULL = unread
```

`Attachment` is `JSON NOT NULL`, so the compose path defaults it to `[]` when the
admin sends no attachment.

#### 2.4.2 Repo / type
New `site/src/lib/db/messages.repo.ts`, following the `implants.repo.ts` shape
(a class + singleton export + a `Message` type + an `isMessage` guard):

- `getForRecipient(userId)` — a player's messages, newest first, joining
  `Sender` → `Users` for the sender name (system messages have a null sender).
- `getUnreadCountForRecipient(userId)` — `COUNT(*) WHERE Recipient = ? AND ReadAt
  IS NULL`, for the notification badge.
- `markRead(id, userId)` — `UPDATE Messages SET ReadAt = NOW() WHERE Id = ? AND
  Recipient = ?`.
- `send({ sender, recipient, subject, message, attachment })` — insert one row
  (`sender` null = system message).
- `sendBulk(recipients, { subject, message, attachment })` — one message fanned
  out to many players, using the multi-row `INSERT ... VALUES` + transaction
  pattern already in `implantRepo.saveBulk`/`setCharacterAccess`.

#### 2.4.3 API
- **Admin send** — `POST /api/messages` (new `site/src/routes/api/messages/+server.ts`),
  `authGuardForUser(token, ['admin'])`, body `{ recipients: number[], subject,
  message, attachment? }` → `send`/`sendBulk`. Mirror the auth/validation style of
  `site/src/routes/api/implants/[id]/+server.ts`.
- **Player read** — `GET /api/my/messages` and `POST /api/my/messages/[id]/read`
  (new, under `site/src/routes/api/my/**`), scoped to the session user like the
  other `api/my` endpoints; plus `GET /api/my/messages/unread-count` for the
  badge.

#### 2.4.4 Manage page — admin sends messages to players
New route `site/src/routes/manage/messages/`, mirroring `manage/emails` /
`manage/implants`:

- `+page.svelte` + `+page.server.ts` — list of sent messages (loaded via the
  admin `GET /api/messages`), with the "add new" `CirclePlus` link above the
  table (per the manage UI convention in `site/CLAUDE.md`) pointing at the
  compose page.
- `new/+page.svelte` — compose form that POSTs to `/api/messages`: a **recipient
  multi-select**, a subject input, a message textarea, and an optional
  attachment. Recipients are `Users` (`Messages.Recipient` → `Users`), so feed
  the picker from `/api/users`; reuse the searchable multi-select pattern in
  `site/src/lib/components/character-access-select.svelte`.
- `message-form.svelte` — a form component like `implant-form.svelte` /
  `email-template-form.svelte`, bound to the draft message.

#### 2.4.5 Notification flow (device)
On send, the server pushes a notification to the recipient's connected device
over the realtime channel (today WS `/connections`, target MQTT — see
[§3](#3-data-infrastructure)); the device shows the server-requested
**Notification screen** (per [§4](#4-ui-overview)), then fetches the new message
via `GET /api/my/messages`. The unread badge comes from
`getUnreadCountForRecipient`.

### 2.5 View messages — *screen exists; data path to build*
Messages are displayed by **sender and subject**. Firmware screen:
`cyd/src/ui/ui_Messages.c`. It consumes the same delivery layer as
[§2.4](#24-receive-messages--table-exists-delivery-to-build): lists the player's
messages from `GET /api/my/messages` (sender name resolved via the `Sender` →
`Users` join), and marks one read via `POST /api/my/messages/[id]/read`.

### 2.6 View prints (lives) — *needs building (new)*
A screen, **reachable from the Home screen**, shows the player's current number
of **prints** (lives), where the player can **remove** (decrement) their own
prints. This is an **entirely new** concept — no prints/lives data exists today —
so it mirrors the implant-charges shape ([§2.3](#23-activate-implant-charges--needs-building-refactor)):
a config value plus a running counter, an admin refresh, and a device
decrement. The **divider** ([§2.7](#27-prints-divider--needs-building-new-server-navigated))
builds on the same counter.

#### 2.6.1 Data model
Prints attach to the per-event snapshot `Character_Versions`, with the same
config-vs-runtime split implants use (`MaxCharges`/`ChargesRemaining`) and the
same precedent as `Characters.ImplantLimit`:

- **Config** — `Character_Versions.MaxPrints INT NOT NULL DEFAULT 0` (starting
  lives for this version).
- **Runtime** — `Character_Versions.PrintsRemaining INT NOT NULL DEFAULT 0` (what
  the player has left).

New migration `site/db/migrations/0019_character_prints.sql` (after the `0018`
messages migration):

```sql
ALTER TABLE `Character_Versions`
  ADD COLUMN `MaxPrints`       int NOT NULL DEFAULT 0,
  ADD COLUMN `PrintsRemaining` int NOT NULL DEFAULT 0;
```

> If prints must reset **per event** (the same character version played at two
> events), move `PrintsRemaining` onto `Event_Participants` (`Event`, `User`,
> `CharacterVersion`) instead; the rest of the design is unchanged.

#### 2.6.2 Repo / type
In `site/src/lib/db/character_version.repo.ts`:

- Add `maxPrints` / `printsRemaining` to the `CharacterVersionBare` type; select
  them in the version reads; write them in `create` / `update`.
- Add `spendPrint(versionId)` — `UPDATE Character_Versions SET PrintsRemaining =
  PrintsRemaining - 1 WHERE Id = ? AND PrintsRemaining > 0`; and
  `refreshPrints(versionId)` — reset `PrintsRemaining` to `MaxPrints` (the admin
  refresh). These are the prints counterparts to `spendCharge` /
  `refreshCharges`.

#### 2.6.3 Manage-page changes
- Add **prints** inputs (max + current) to the character-version editor reached
  from `site/src/routes/manage/characters/[id]/**` (and
  `manage/characters/versions`), alongside the existing expertise / implants /
  items editing, flowing through the same save path.
- Add an admin **refresh prints** control (reset remaining → max) on the same
  character/session management surface as the implant-charges refresh
  ([§2.3.3](#233-manage-page-changes)).

#### 2.6.4 Device flow
The Home-accessible Prints screen reads the count via an authenticated
`site/src/routes/api/my/**` endpoint (scoped to the player's own session);
"remove" decrements via `POST /api/my/prints/decrement`, which runs
`spendPrint`; the server pushes the updated count back so the screen re-renders.
Same session-scoped pattern as the implant activation flow
([§2.3.4](#234-activation-flow-device)).

### 2.7 Prints divider — *needs building (new, server-navigated)*
The server can navigate the AguesGuard to a **divider screen** where a player
divides their share of a **mission's print pool**. Like the Download and
Notification screens, it is shown **only on server request**, not from the Home
menu, and it reuses the server-navigated-screen mechanism that already exists in
the codebase (add `'divider'` to the `Screens` enum / `Screen` type in
`site/websocket-server/connection-socket.ts` and to the firmware's screen
handling, the same way `virus` / `loot` / `loading` are defined).

The print pool itself is **not a standalone concept** — it only ever exists as
part of a [Mission](#214-missions--needs-building-new). There is no admin-created
ad hoc pool independent of a mission: the pool's total and each participant's
share live directly on `Missions` / `Mission_Participants` (see
[§2.14](#214-missions--needs-building-new) for the full data model, repo, and
manage-page design). The screen is reached exclusively through mission
registration ([§2.15](#215-arduino-uid-registry--needs-building-new)), not
through a manual "create a pool" control on the live dashboard.

Device flow: the divider is shown only on server request (per
[§4](#4-ui-overview)); the player adjusts their share on the screen, the
allocation saves via API/MQTT (`missionRepo.setAllocation`), and the admin
closing the mission writes each participant's share back to `PrintsRemaining`
(feeding [§2.6](#26-view-prints-lives--needs-building-new)) via
`missionRepo.closeMission`.

### 2.8 Play download animations — *screen exists*
Playing a download animation is one of the **actions the server commands** after
a device connects to an Arduino (see [§2.9](#29-connect-to-arduinos-for-irl-interactions--partly-exists)).
Firmware screen: `cyd/src/ui/ui_DownloadScreen.c` (transition logic in
`cyd/src/ui-downloading.cpp`).

### 2.9 Connect to Arduinos for IRL interactions — *partly exists*
The CYD has a cable with a **magnetic connector** that can connect to an Arduino.
The Arduino simply sends a **UID** that the CYD **relays to the server**; the
server responds with the **action** the CYD should take (e.g. play a download
animation, show a notification, open the prints divider). The UART relay path
already exists in firmware (`cyd/src/uart-interface.cpp` →
`cyd/src/web-socket.cpp`). The legacy loot/virus mini-game
(`cyd/src/ui-loot.cpp`, `cyd/src/ui-virus.cpp`, `ui_LootScreen.c`,
`ui_VirusScreen.c`) is superseded by this generic **UID → server action** model;
those screens remain available for reuse as server-commanded actions.

This section describes the relay mechanism that already exists; what a given
UID actually *means* — which of the two available actions it triggers, and how
the server resolves that — is specified concretely in
[§2.14](#214-missions--needs-building-new) (mission registration) and
[§2.15](#215-arduino-uid-registry--needs-building-new) (the UID→action
registry that replaces today's legacy timer heuristic in `handleLink()`).

### 2.10 View battery level — *needs building*
The CYD is powered by **two 18650 batteries**; the Home screen shows the current
battery level. A `battery-full.png` asset exists
(`cyd/src/ui/drive/assets/`), but there is **no ADC voltage read** in firmware
yet.

### 2.11 Power-save mode — *needs building*
The device goes into **power-save mode** and **wakes up on touch** to preserve
battery. No deep/light-sleep handling exists in firmware today.

### 2.12 View WiFi strength — *needs building*
The Home screen shows **WiFi strength**. A WiFi status-bar icon asset exists
(`cyd/src/ui/ui_img_wifi_png.c`) and the WebSocket protocol already declares a
`wifiStrength` field (`site/websocket-server/connection-socket.ts`), but the
firmware does not yet read RSSI or populate it (`cyd/src/connection.cpp` does a
plain connect only).

### 2.13 Read data on SD — *exists*
Every player has a **personal SD card** with their information: personal session
id, WiFi configuration, and images to load such as the expertise icons. The
firmware reads `/config.json` at boot (`cyd/src/sd-reader.cpp` → globals).

### 2.14 Missions — *needs building (new)*
During the event, players go on **missions**. A mission is created and
administered by an admin on a manage screen, and its **participant list is
filled automatically** as players register for it — not entered by the admin.

A mission has:
- **Name** — free text, with a **"generate name"** option on the manage form.
- **Print pool** — the number of prints available for the mission's
  participants to divide among themselves.
- **Player limit** — the maximum number of players who can register.
- **Participants** — filled out on registration (see below), read-only on the
  manage page.

The print pool is **owned by the mission**, not a separate reusable concept —
see [§2.7](#27-prints-divider--needs-building-new-server-navigated) for how a
mission's pool feeds the divider screen.

#### 2.14.1 Data model
New migration `site/db/migrations/0021_missions.sql` (next free number after
this doc's existing `0017`–`0019` reservations):

```sql
CREATE TABLE `Missions` (
  `Id`          int NOT NULL AUTO_INCREMENT,
  `Name`        varchar(255) NOT NULL,
  `PlayerLimit` int NOT NULL,
  `Status`      ENUM('open','closed') NOT NULL DEFAULT 'open',
  `PrintPool`   int NOT NULL DEFAULT 0,
  `CreatedAt`   datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Mission_Participants` (
  `Mission`          int NOT NULL,
  `CharacterVersion` int NOT NULL,
  `AvailablePrints`  int NOT NULL DEFAULT 0,
  `RegisterAt`       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Mission`,`CharacterVersion`),
  CONSTRAINT `mp_mission` FOREIGN KEY (`Mission`) REFERENCES `Missions`(`Id`),
  CONSTRAINT `mp_cv`      FOREIGN KEY (`CharacterVersion`) REFERENCES `Character_Versions`(`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

`Missions.PrintPool` is the total to be divided; `Mission_Participants.
AvailablePrints` is each registered character's current share (defaults `0`,
adjusted live on the divider screen). The roster's primary key is `(Mission,
CharacterVersion)` — a character can only register once per mission, and a
re-scan of the same UID by the same character is idempotent. There is
deliberately **no `User` column** on the roster — the participant's player is
derived when needed via `CharacterVersion → Character → Owner → Users`, the
same path `Characters.Owner` already uses elsewhere.

#### 2.14.2 Repo
New `site/src/lib/db/mission.repo.ts` (class + singleton, following
`implants.repo.ts`):

- `getAll()` / `getWithId(id)` — mission plus its full roster (joined out to
  `Character_Versions → Characters → Users` for each participant's
  player/character name).
- `create({ name, printPool, playerLimit })` — plain insert, `Status = 'open'`.
- `edit({ id, name, printPool, playerLimit, status })` — `printPool` is
  editable only while `Status = 'open'`.
- `delete(id)` — delete `Mission_Participants` rows, then the `Missions` row.
- `registerParticipant({ missionId, characterVersionId })` — the registration
  transaction driven by an Arduino scan (see
  [§2.15](#215-arduino-uid-registry--needs-building-new)): `SELECT ... FOR
  UPDATE` the `Missions` row (also checks `Status = 'open'`) to close the
  player-limit race, count existing participants against `PlayerLimit`, then
  `INSERT ... ON DUPLICATE KEY UPDATE` into `Mission_Participants`
  (`AvailablePrints` defaults `0`).
- `setAllocation({ missionId, characterVersionId, amount })` — used live by
  the divider screen as a player adjusts their share; validates
  `SUM(AvailablePrints)` across the mission's roster (with this update
  applied) does not exceed `PrintPool` before committing, rejecting
  otherwise.
- `closeMission(missionId)` — transaction: for every `Mission_Participants`
  row, add `AvailablePrints` onto that `CharacterVersion`'s
  `Character_Versions.PrintsRemaining` (the counterpart to
  [§2.6](#26-view-prints-lives--needs-building-new)'s `spendPrint`/
  `refreshPrints`), then set `Missions.Status = 'closed'`.

#### 2.14.3 Manage page
New `site/src/routes/manage/missions/**`, mirroring `manage/implants/**`
(list + `new/` + `[id]/`, a shared `mission-form.svelte` bound via
`$bindable`, `CirclePlus`-add-new convention, PUT-create/POST-update/DELETE,
per `site/CLAUDE.md`):

- **Name** — text input, plus a "Generate" button that calls a new small
  `GET /api/missions/generate-name` endpoint (backed by a new
  `site/src/lib/utils/random-name.ts` adjective+noun picker, no persistence)
  and fills the still-editable field.
- **Player limit** — number input.
- **Print pool** — number input (`PrintPool`), editable only while
  `Status = 'open'`.
- **Participants** (edit page only, **read-only**) — a table of
  `Mission_Participants`: character/player name, `AvailablePrints`,
  `RegisterAt`. Filled by registration, not admin-editable.
- **Close mission** button (edit page) — calls `closeMission`, finalizing the
  print-pool split, the same kind of admin-triggered finalize action as the
  existing implant-charges refresh control
  ([§2.3.3](#233-manage-page-changes)).

New API routes, following `api/implants/**`'s `handleRequest` +
`authGuardForUser` + GET-list/PUT-create/GET+POST+DELETE-by-id shape:
`api/missions/+server.ts`, `api/missions/[id]/+server.ts`,
`api/missions/generate-name/+server.ts`,
`api/missions/[id]/close/+server.ts` (POST → `closeMission`), and
`api/my/missions/[id]/allocation/+server.ts` (POST → `setAllocation`,
session-scoped to the player's own `CharacterVersion`, used by the divider
screen — see [§2.7](#27-prints-divider--needs-building-new-server-navigated)).

### 2.15 Arduino UID registry — *needs building (new)*
An admin manage page for **creating and assigning Arduino UIDs**. Each UID is
assigned exactly **one of two actions**:

1. **Go to download** — plays the existing download/animation screen
   ([§2.8](#28-play-download-animations--screen-exists)); no extra data.
2. **Register for mission** — must reference an existing
   [Mission](#214-missions--needs-building-new). When a CYD scans a UID
   assigned to this action, the server registers the scanning player into
   that mission (respecting its player limit) and sends the CYD to the
   **divider screen** to divide its share of the mission's print pool.

#### 2.15.1 Data model
Same migration `site/db/migrations/0021_missions.sql`:

```sql
CREATE TABLE `Arduino_Uids` (
  `Uid`       varchar(255) NOT NULL,
  `Name`      varchar(255) NOT NULL,
  `Action`    ENUM('download','register_mission') NOT NULL DEFAULT 'download',
  `Mission`   int NULL DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Uid`),
  CONSTRAINT `au_mission` FOREIGN KEY (`Mission`) REFERENCES `Missions`(`Id`),
  CONSTRAINT `au_action_mission_pair` CHECK (
    (`Action` = 'register_mission' AND `Mission` IS NOT NULL) OR
    (`Action` = 'download' AND `Mission` IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

`Uid` is the primary key (not an autoincrement int) — the UID string is the
natural key, the same way `Sessions.Token` already works. The CHECK constraint
is a backstop; the API layer validates the action/mission pairing too.

#### 2.15.2 Repo
New `site/src/lib/db/arduino_uid.repo.ts`: `getAll`, `getWithId`, `create`,
`edit`, `delete`, and `resolveAction(uid)` — the hot-path lookup used by the
server dispatch below, returning `{ action, missionId } | null` (`null` =
unregistered UID).

#### 2.15.3 Server-side dispatch
This is the concrete server-side counterpart to
[§2.9](#29-connect-to-arduinos-for-irl-interactions--partly-exists)'s "server
responds with the action." `handleLink()` in
`site/websocket-server/connection-socket.ts` today keys a process-lifetime
`Map<string, Date>` timer heuristic purely off the raw token string, with no
DB involvement (first sighting of a token → `'loading'`; a second sighting
within a 3–4.8s window → `'loot'`). This is **replaced, not extended**:

- On each `link` message, look up `linkTarget` (the Arduino's UID) via
  `arduinoUidRepo.resolveAction()`.
- If `action === 'download'`, send `{goTo: {targetToken: origin, screen:
  'loading'}}` back to the *originating* CYD (`origin`).
- If `action === 'register_mission'`, resolve the scanning player's identity
  via `sessionRepo.getCredentials(origin)` → `eventRepo.getWithStatus('Live')`
  → `eventParticipantsRepo.getUserParticipation({eventId, userId})` — all
  three already exist in the repo layer today — call
  `missionRepo.registerParticipant(...)`, then push `{goTo: {targetToken:
  origin, screen: 'divider', data: {missionId}}}`, the first real use of the
  already-declared-but-never-populated `goTo.data` field.
- An unmatched UID, or a full/closed mission, is a documented gap (see
  [§7](#7-what-needs-building)), not silently designed away.

The legacy `links: Map<string, Date>` field and its timer heuristic are
deleted entirely, not built on — consistent with
[§2.9](#29-connect-to-arduinos-for-irl-interactions--partly-exists)'s existing
note that the loot/virus mini-game is superseded, not extended, by the
generic UID → server action model.

#### 2.15.4 Manage page
New `site/src/routes/manage/arduino-uids/**` + `arduino-uid-form.svelte`,
following the same implants-page template:

- **Uid** — text input (the admin transcribes it off the physical Arduino;
  there is no on-device capture/scan flow — out of scope here).
- **Name** — text input (admin-facing label, e.g. "Terminal 3 — comms room").
- **Action** — select (`download` / `register_mission`).
- **Mission** — a `<select>` of missions (fetched from `GET /api/missions`),
  shown only when Action is `register_mission`.

New API routes: `api/arduino-uids/+server.ts`,
`api/arduino-uids/[uid]/+server.ts` (route param is the UID string, not
numeric — reject empty/whitespace instead of `isNumberOrError`).

#### 2.15.5 Programming flow: generate sketch + copy to clipboard
The physical UID Arduino just needs to loop `Serial.println(uid)` — it has no
other job (see [`cyd/src/uart-interface.cpp`](../cyd/src/uart-interface.cpp):
the CYD reads a newline-delimited token over UART and calls `sendLink()`). To
save the admin from hand-editing a `.ino` file per device, the manage page
generates that sketch client-side and puts it on the clipboard:

- Each row in `manage/arduino-uids` gets a **"Copy Arduino code"** button next
  to the existing edit/delete actions.
- Clicking it fills a small template — a fixed sketch body with the row's
  `Uid` substituted into a `const char* UID = "...";` line — and writes the
  result to the clipboard via `navigator.clipboard.writeText()`. No server
  round-trip; the template is static and the UID is already on the page.
- Template shape:

  ```cpp
  const char* UID = "{uid}";

  void setup() {
    Serial.begin(115200);
  }

  void loop() {
    Serial.println(UID);
    delay(1000);
  }
  ```

- Admin flow: click **Copy Arduino code** → paste into the Arduino IDE (or
  PlatformIO) → select the target board/port → upload. This reuses the
  Arduino IDE the admin already has installed instead of building tooling to
  replace it.
- **Out of scope for this doc:** a browser-based uploader (e.g. Web Serial
  API) that flashes the sketch directly, without going through the Arduino
  IDE, was considered but rejected for the first pass — it needs
  board-specific programmer/bootloader handling (avrdude protocol, baud
  reset-to-bootloader quirks per board) that varies by which Arduino model is
  used for the UID tags, which isn't pinned down yet. If the UID hardware is
  standardized on one board, a "Program via USB" button using Web Serial is a
  reasonable follow-up, replacing this section's copy-paste step with a
  one-click flash — but it doesn't change the sketch template above, only how
  it gets onto the device.

---

## 3. Data infrastructure

```mermaid
flowchart LR
    SD[(SD card\nsession id, WiFi config, images)]
    Arduino["Arduino\n(magnetic connector)"]

    subgraph Device["AguesGuard (CYD)"]
        AG["ESP32 + LVGL UI"]
    end

    Broker["MQTT broker"]

    subgraph Site["terra-prime site (SvelteKit)"]
        Dashboard["Site / dashboard"]
        Manage["Site / manage"]
        Codex["Site / codex"]
        Server["Server"]
        DB[(database\nMySQL)]
    end

    SD -- "read at boot" --> AG
    Arduino -- "UART: UID" --> AG
    AG <-- "MQTT" --> Broker
    AG <-- "HTTP" --> Server
    Dashboard <-- "websockets" --> Broker
    Manage <-- "HTTP" --> Server
    Codex <-- "HTTP" --> Server
    Server <--> DB
```

Channels:

| Channel | Endpoints | Purpose |
|---|---|---|
| SD | SD → AguesGuard | Boot config (session id, WiFi), images/icons |
| UART | Arduino → AguesGuard | Relayed UID from the magnetic connector |
| MQTT | AguesGuard ⇄ broker | Device telemetry out, server actions in |
| HTTP | AguesGuard ← server | Fetch character/expertise/implant/message/print data |
| WebSockets | Site dashboard ⇄ broker | Live device view for admins |
| HTTP | Site manage ← server | Admin management UI |
| HTTP | Site codex ← server | Player-facing codex UI |
| — | Server ⇄ database | Persistence |

> **Current state vs. target.** MQTT is the **target** transport for the device
> and the admin dashboard. The broker runs as its own Railway service — see the
> setup guide **`docs/MQTT_SETUP.md`**. Today, both the device and the
> `manage/sessions` dashboard use a single WebSocket endpoint `/connections`
> (`site/websocket-server/*`, `cyd/src/web-socket.cpp`); there is **no MQTT in
> the repo yet**. See [§7](#7-what-needs-building).

---

## 4. UI overview

```mermaid
flowchart TB
    Home["Home screen\n(WiFi strength + battery level)"]

    Expertise["Expertise"]
    Implants["Implants"]
    Messages["Messages"]
    Prints["Prints (lives)"]

    Download["Download screen"]
    Notification["Notification screen"]
    Divider["Prints divider screen"]

    Home --> Expertise
    Home --> Implants
    Home --> Messages
    Home --> Prints

    Expertise -- "Home button" --> Home
    Implants -- "Home button" --> Home
    Messages -- "Home button" --> Home
    Prints -- "Home button" --> Home

    Server["Server request"] -.-> Download
    Server -.-> Notification
    Server -.-> Divider
```

- **Home screen** — entry point, with navigation to **Expertise**, **Implants**,
  **Messages**, and **Prints (lives)**. Displays **WiFi strength** and **battery
  level**.
- **Every page has a Home button** to navigate back to Home.
- **Download screen** — displayed **only on request of the server** (an action
  after an Arduino connect).
- **Notification screen** — displayed **only on request of the server** (new
  message received).
- **Prints divider screen** — displayed **only on request of the server**, for
  dividing a mission's print pool among its registered players (reached via
  mission registration, [§2.14](#214-missions--needs-building-new)).

---

## 5. Firmware components

```mermaid
flowchart TB
    main["main.cpp\nsetup() / loop()"]
    globals["globals.h/.cpp\nWiFi creds, domain, api_url,\nsession id"]
    sd["sd-reader.h/.cpp\nreads /config.json + images → globals"]
    conn["connection.cpp\nconnectToWifi() (+ RSSI: to build)"]
    net["web-socket.h/.cpp\nstatus/link out, action in\n(MQTT: to build)"]
    char["character.h/.cpp\nfetch character data (HTTP GET)"]
    uart["uart-interface.h/.cpp\nreads Arduino UID, relays to server"]
    power["power (to build)\nADC battery read, deep/light sleep,\nwake-on-touch"]
    ui["ui-implementation.h/.cpp\nLVGL init, display flush,\ntouch read, uiSetup()/uiLoop()"]
    screens["ui/*\nHome, Expertise (Skills), Implants,\nMessages, Prints, Download,\nNotification, Divider"]
    xition["ui-downloading.cpp / ui-loot.cpp / ui-virus.cpp\nserver-action screen transitions"]

    main --> sd
    main --> conn
    main --> net
    main --> char
    main --> uart
    main --> power
    main --> ui
    sd --> globals
    conn --> globals
    net --> globals
    char --> globals
    net -- "server action" --> xition
    xition --> screens
    ui --> screens
    uart --> net
```

> Note: as of the current firmware, `main.cpp` boots directly into the UI with
> SD/WiFi/character-fetch/network init **commented out** (dev-mode state) — see
> `cyd/CLAUDE.md`.

---

## 6. Data model touchpoints

Full schema reference: `site/CLAUDE.md`. Full REST endpoint reference:
`site/src/routes/api/CLAUDE.md`.

| Feature | Tables | State |
|---|---|---|
| Expertise | `Expertise`, `Expertise_Groups`, `Character_Version_Expertise` (`Value`) | Exists (manage-only routes) |
| Implants | `Implants`, `Character_Version_Implants` | Exists (manage-only routes) |
| Implant charges | `Implants.MaxCharges` (catalog) + `Character_Version_Implants.ChargesRemaining` (instance) | Needs building — see [§2.3](#23-activate-implant-charges--needs-building-refactor) |
| Messages | `Messages` (`Sender`, `Recipient`, `Subject`, `Message`, `Attachment`) + new `CreatedAt` / `ReadAt` | Table exists; repo + API + admin send page + delivery to build — see [§2.4](#24-receive-messages--table-exists-delivery-to-build) |
| Prints (lives) | `Character_Versions.MaxPrints` + `Character_Versions.PrintsRemaining` | Needs building — see [§2.6](#26-view-prints-lives--needs-building-new) |
| Prints divider | `Missions.PrintPool` + `Mission_Participants.AvailablePrints` (mission-scoped, see below) | Needs building — see [§2.7](#27-prints-divider--needs-building-new-server-navigated) / [§2.14](#214-missions--needs-building-new) |
| Missions | `Missions`, `Mission_Participants` | Needs building — see [§2.14](#214-missions--needs-building-new) |
| Arduino UID registry | `Arduino_Uids` | Needs building — see [§2.15](#215-arduino-uid-registry--needs-building-new) |
| Session identity | `Sessions` / `Session_Roles` — `sessionToken` provisioned to the SD card out-of-band | Exists |

---

## 7. What needs building

Real, current gaps between this target design and the code — documented so
they're visible, not silently assumed.

1. **MQTT transport.** The target device/dashboard transport is MQTT (device ⇄
   broker, dashboard ⇄ broker over websockets), with the broker deployed as a
   separate Railway service (setup guide: `docs/MQTT_SETUP.md`). Today both use a
   single WebSocket `/connections` endpoint (`site/websocket-server/*`,
   `cyd/src/web-socket.cpp`); there is no MQTT broker, client, or config anywhere
   in the repo yet.
2. **Implant charges.** No charge concept exists. Needs DB (`Implants.MaxCharges`
   + `Character_Version_Implants.ChargesRemaining`, migration
   `0017_implant_charges.sql`), repo `spendCharge`/`refreshCharges` methods, a
   "max charges" field on the implant manage form, a device activation endpoint
   under `api/my/**`, and an admin refresh endpoint/control. Full design in
   [§2.3](#23-activate-implant-charges--needs-building-refactor).
3. **Messages API + notifications.** The `Messages` table exists but has no
   `CreatedAt`/`ReadAt` columns (migration `0018_message_delivery.sql`), no repo
   (`messages.repo.ts`: `getForRecipient`, `getUnreadCountForRecipient`,
   `markRead`, `send`, `sendBulk`), no API (admin `POST /api/messages`, player
   `GET/POST /api/my/messages`), no **admin send-message manage page**
   (`manage/messages/**`), and no push/notification path to drive the device
   Notification screen. Full design in
   [§2.4](#24-receive-messages--table-exists-delivery-to-build).
4. **Prints (lives).** Entirely new. Needs DB (`Character_Versions.MaxPrints` +
   `PrintsRemaining`, migration `0019_character_prints.sql`), repo
   `spendPrint`/`refreshPrints` methods, prints inputs + a refresh control on the
   character-version manage editor, and a device `POST /api/my/prints/decrement`
   endpoint. The **divider** is mission-scoped — see item 13 below and
   [§2.6](#26-view-prints-lives--needs-building-new) /
   [§2.7](#27-prints-divider--needs-building-new-server-navigated).
5. **Battery level.** No ADC voltage read for the 2× 18650 pack (only a static
   `battery-full.png` asset).
6. **Power-save + wake-on-touch.** No ESP deep/light-sleep handling in firmware.
7. **WiFi strength.** No RSSI read; `wifiStrength` is declared in the WS protocol
   (`connection-socket.ts`) but never populated by firmware.
8. **Player-facing data on device.** Expertise and implants have only `/manage`
   routes; a read path scoped to the player's own session is needed for the
   device.
9. **Firmware "Skills" → "Expertise" rename.** The site renamed skills to
   expertise (`0013_rename_skills_to_expertise.sql`); the firmware screen is
   still `ui_Skills.c`.

Carried-over integration gaps (still valid):

10. **Production entrypoint skips the realtime server.** `site/package.json`
    defines `start` (plain adapter-node) and `start:websocket` (the Express+`ws`
    wrapper that mounts `/connections`). `site/dockerfile` runs `pnpm start` and
    `site/railway.toml` does not override it — so the deployed container does not
    expose the realtime endpoint.
11. **Hardcoded local WebSocket URL.**
    `site/src/routes/manage/sessions/+page.svelte` connects to a hardcoded
    `ws://localhost:5173/connections` (not the deployed domain, not `wss://`).
12. **Unauthenticated firmware request against a gated endpoint.**
    `fetchCharacter()` (`cyd/src/character.cpp`) sends a plain `GET` with no auth
    header, but the character REST route is guarded by `authGuardForUser` (admin
    role).
13. **Missions + Arduino UID registry.** Entirely new. Needs DB (`Missions`,
    `Mission_Participants`, `Arduino_Uids`, migration `0021_missions.sql`), two
    new repos (`mission.repo.ts`, `arduino_uid.repo.ts`), API routes under
    `api/missions/**`, `api/my/missions/**`, and `api/arduino-uids/**`, two new
    manage-page trees (`manage/missions/**`, `manage/arduino-uids/**`), and a
    rewrite of `handleLink()` in `connection-socket.ts` to look up the UID
    registry instead of the current in-memory timer heuristic. Full design in
    [§2.14](#214-missions--needs-building-new) /
    [§2.15](#215-arduino-uid-registry--needs-building-new). Caveats:
    - Unregistered UID scans are silently ignored (logged server-side, no
      device-visible error).
    - No dedicated "registration failed" screen exists on-device yet for a
      full/closed mission — falls back to re-sending `'loading'` with an
      `error` field in `data` that firmware doesn't read yet.
    - `goTo.data` and `targetToken`-based addressing are declared server-side
      but not yet consumed/checked by firmware's `handleMessage()` — a
      firmware-side prerequisite for the divider screen generally, first
      actually needed by missions.
    - Single-`Live`-event assumption when resolving which `CharacterVersion` a
      scanning player is playing.
    - `handleLink()` needs its first-ever DB access from
      `site/websocket-server/*` (plain `mysql2/promise`, no SvelteKit-specific
      imports, so repo files are importable by relative path, not the `$lib`
      alias) — pair with items 1 (MQTT transport) and 10 (production
      entrypoint skipping the realtime server) as the same subsystem's rough
      edges.

---

## 8. File / reference index

| Area | File(s) |
|---|---|
| Firmware entry / lifecycle | `cyd/src/main.cpp` |
| Firmware shared state | `cyd/src/globals.h`, `cyd/src/globals.cpp` |
| SD config + image loading | `cyd/src/sd-reader.h`, `cyd/src/sd-reader.cpp` |
| WiFi connect (RSSI: to build) | `cyd/src/connection.cpp` |
| Realtime client (MQTT: to build) | `cyd/src/web-socket.h`, `cyd/src/web-socket.cpp` |
| Character fetch (HTTP) | `cyd/src/character.h`, `cyd/src/character.cpp` |
| Arduino UID input (UART) | `cyd/src/uart-interface.h`, `cyd/src/uart-interface.cpp` |
| LVGL/display glue | `cyd/src/ui-implementation.h`, `cyd/src/ui-implementation.cpp` |
| Server-action screen transitions | `cyd/src/ui-downloading.cpp`, `cyd/src/ui-loot.cpp`, `cyd/src/ui-virus.cpp` |
| SquareLine-generated screens | `cyd/src/ui/*` (Home, Skills→Expertise, Implants, Messages, Items, DownloadScreen, LootScreen, VirusScreen) |
| Firmware architecture notes | `cyd/CLAUDE.md` |
| Realtime server (current WS) | `site/websocket-server/index.ts`, `socket-server.ts`, `connection-socket.ts` |
| Admin live dashboard | `site/src/routes/manage/sessions/+page.svelte`, `site/src/lib/components/session-row.svelte` |
| Expertise (admin) | `site/src/routes/manage/expertise/**`, `site/src/routes/api/expertise/**` |
| Implants (admin) | `site/src/routes/manage/implants/**`, `site/src/routes/api/implants/**` |
| Messages (admin send: to build) | `site/src/routes/manage/messages/**`, `site/src/routes/api/messages/**`, `site/src/routes/api/my/messages/**`, `site/src/lib/db/messages.repo.ts` |
| Recipient/user list (reuse) | `site/src/routes/api/users/**`, `site/src/lib/components/character-access-select.svelte` |
| Prints (lives: to build) | `site/src/lib/db/character_version.repo.ts` (`MaxPrints`/`PrintsRemaining`, `spendPrint`/`refreshPrints`), `site/src/routes/manage/characters/[id]/**`, `site/src/routes/api/my/prints/**` |
| Prints divider (to build) | `site/src/lib/db/mission.repo.ts` (`setAllocation`/`closeMission`), `site/websocket-server/connection-socket.ts` (`Screens` enum) — mission-scoped, see [§2.14](#214-missions--needs-building-new) |
| Missions (to build) | `site/db/migrations/0021_missions.sql`, `site/src/lib/db/mission.repo.ts`, `site/src/lib/utils/random-name.ts`, `site/src/routes/manage/missions/**`, `site/src/routes/api/missions/**`, `site/src/routes/api/my/missions/**` |
| Arduino UID registry (to build) | `site/src/lib/db/arduino_uid.repo.ts`, `site/src/routes/manage/arduino-uids/**`, `site/src/routes/api/arduino-uids/**`, `site/websocket-server/connection-socket.ts` (`handleLink()` — needs DB access, first use in this subsystem) |
| Codex (player UI) | `site/src/routes/codex/**` |
| Character REST endpoint | `site/src/routes/api/characters/[characterId]/+server.ts` |
| Schema (incl. `Messages`) | `site/db/migrations/0001_initial_schema.sql`, `site/CLAUDE.md` |
| Site API reference | `site/src/routes/api/CLAUDE.md` |
| Deployment config | `site/dockerfile`, `site/railway.toml`, `site/package.json` |
