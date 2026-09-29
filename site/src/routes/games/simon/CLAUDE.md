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

## Why this needs no auth at all

The pygame version had to authenticate as an admin over HTTP to look up an arbitrary
player's character by name, because `/api/events` and `/api/characters` are admin-gated
routes. This route doesn't have that problem: `lookup/+server.ts` runs *inside* the same
server process as those routes, so `$lib/server/games/simon.service.ts` calls
`characterRepo` / `eventRepo` / `characterVersionRepo` / `expertiseRepo` /
`eventPlayersRepo` directly — the same functions the admin-gated HTTP routes call
internally — with no HTTP hop and no privileged session token.

The page and the lookup endpoint carry no session check of their own either (TP-0206) —
this is a walk-up terminal, not a per-player login, so anyone who can reach the route can
resolve any character by name. `/games` stays in `+layout.svelte`'s `PUBLIC_PATHS` for the
same reason it needed to be there when the route *did* check a session: the global
"bounce to `/codex` if not logged in" effect shouldn't apply to a page that was never
gated on login in the first place.

## Lookup chain

Given a character name, resolve their Software & Hacking experience for the version
registered to the most recent `Live` event — mirrors
`minigames/simon-says/simon/api.py`'s chain, minus the HTTP/auth layer:

1. `eventRepo.getWithStatus(EventStatus.Live)` → latest by `start`, ties broken by id
2. `characterRepo.getAll()` → match name case-insensitively (names aren't unique)
3. `eventPlayersRepo.getPlayerForCharacter({eventId, characterId})` → the
   version registered for that event
4. `characterVersionRepo.getWithId(versionId)` + `expertiseRepo.getAll()` → resolve
   `Software & Hacking` by name (id 6 is only a fallback — production ids are
   AUTO_INCREMENT)

## Difficulty

`$lib/games/simon/difficulty.ts` maps hacking XP to a sequence length (upper band wins at
every boundary): 100→2, 80-99→3, 60-79→4, 40-59→5, 20-39→6, 0-19→7. Three clean rounds in
a row wins; a mistake resets the streak but doesn't end the run.

## Win screen: Vostok-9 dossierarchief (TP-0245)

Winning (`state === 'win'`) swaps the pad grid for `DossierArchive.svelte`, a file browser
laid out like the codex `$lib/components/dir-window.svelte` (tree left, preview right) but
over static data rather than `/api/drive`. `Escape` or `[ AFMELDEN ]` calls `game.restart()`;
`Enter` no longer restarts in `win` because the archive uses it (with the arrow keys) to
open entries.

- Content lives in `$lib/games/simon/dossiers.ts`. Anatoli's and Katerina's dossiers are
  transcribed from the organizers' Google Docs (`Medisch_Dossier_Anatoli_Lebedev` /
  `Medisch_Dossier_Katerina_Lebedeva`). They're hardcoded on purpose: loading them from
  Drive would also expose them on the codex desktop and in its Drive search. If those docs
  change, update `dossiers.ts` by hand.
- `AvixGraph.svelte` plots `avix.series` on a shared 0–70 E/ml scale, so the siblings compare
  directly. Anatoli's line stops at the drift (`avix.lost`). Katerina's weekly values other
  than 03.11 (58,3) and 05.12 (62,9) are invented to fill the prescribed weekly afnames.
- Corrupt files (`kind: 'corrupt'`) render `corruptLines(id)`: seeded glyph noise that is
  stable per file and unreadable by design. To add one, add an entry with a Russian name.

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
