# `/games/simon`

The game page is `+page.svelte`; the character lookup is a separate `POST /games/simon/lookup`
(`lookup/+server.ts`) rather than a `+server.ts` co-located with `+page.svelte` — SvelteKit
routes a `+server.ts` handler for *all* methods at its path, so a co-located POST-only
`+server.ts` was answering the page's own GET navigation with 405 instead of letting
`+page.svelte` render. Discovered while verifying this against a real browser.

A Simon Says minigame styled after the `/codex` terminal. Superseded the standalone
`minigames/simon-says` pygame prototype (see TP-0202/TP-0204) once it became clear the
game runs on a shared walk-up terminal rather than each player's own device — see
TP-0205 for the discussion.

## Why this needs no admin token

The pygame version had to authenticate as an admin over HTTP to look up an arbitrary
player's character by name, because `/api/events` and `/api/characters` are admin-gated
routes. This route doesn't have that problem: `+page.server.ts` and `+server.ts` run
*inside* the same server process as those routes, so `$lib/server/games/simon.service.ts`
calls `characterRepo` / `eventRepo` / `characterVersionRepo` / `expertiseRepo` /
`eventParticipantsRepo` directly — the same functions the admin-gated HTTP routes call
internally — with no HTTP hop and no privileged session token. The page itself only
requires *any* valid session (role `user`, which every account has); once past that gate,
the lookup can resolve any character by name, by design, since this is meant to be walked
up to.

## Lookup chain

Given a character name, resolve their Software & Hacking experience for the version
registered to the most recent `Live` event — mirrors
`minigames/simon-says/simon/api.py`'s chain, minus the HTTP/auth layer:

1. `eventRepo.getWithStatus(EventStatus.Live)` → latest by `start`, ties broken by id
2. `characterRepo.getAll()` → match name case-insensitively (names aren't unique)
3. `eventParticipantsRepo.getParticipantForCharacter({eventId, characterId})` → the
   version registered for that event
4. `characterVersionRepo.getWithId(versionId)` + `expertiseRepo.getAll()` → resolve
   `Software & Hacking` by name (id 6 is only a fallback — production ids are
   AUTO_INCREMENT)

## Difficulty

`$lib/games/simon/difficulty.ts` maps hacking XP to a sequence length (upper band wins at
every boundary): 100→2, 80-99→3, 60-79→4, 40-59→5, 20-39→6, 0-19→7. Three clean rounds in
a row wins; a mistake resets the streak but doesn't end the run.

## Styling note

`--phosphor-glow-color` / `--phosphor-glow-shadow` in `$lib/styles/theme.css` are
currently broken — a missing semicolon after `--phosphor-glow-color` swallows the next
declaration into its own value, so `var(--phosphor-glow-color)` resolves to nothing
anywhere it's used sitewide. This page doesn't depend on it — the glow in `+page.svelte`
hardcodes the intended `#00ff41`/`#003b00` values locally instead. Not fixed here; it's a
pre-existing, cross-cutting bug outside this route's scope.

## Not carried over from the pygame version

No persistent score/streak storage — the pygame prototype kept a local `highscore.json`,
which has no obvious equivalent for a shared, multi-user web deployment without a new
schema decision. Worth a follow-up if wanted.
