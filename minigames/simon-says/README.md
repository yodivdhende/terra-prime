# Simon Says

A signal-repeat minigame styled after the Terra Prime `/codex` terminal — green-on-black
CRT, phosphor glow, scanlines and ASCII progress bars.

The Federation broadcasts a sequence of signals. Repeat it back before the transmission
window closes. Every round adds one more signal and plays the sequence back slightly
faster.

```
                    ┌───────┐
                    │   U   │
            ┌───────┼───────┼───────┐
            │   L   │       │   R   │
            └───────┼───────┼───────┘
                    │   D   │
                    └───────┘

              [####################......]
```

## Install

Needs Python 3.10+.

```bash
cd minigames/simon-says
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

## Terra Prime connection

The game reads a character's **Software & Hacking** experience from a running Terra
Prime instance and uses it to set the difficulty. Copy the example config and fill it in:

```bash
cp .env.example .env
```

| Variable            | Meaning                                        |
| :------------------ | :--------------------------------------------- |
| `TERRA_PRIME_URL`   | Base URL of the instance (dev: `localhost:5173`) |
| `TERRA_PRIME_TOKEN` | Session token used for API authentication      |

Exported environment variables take precedence over the file.

**The token must come from an admin account.** Resolving a character by name needs
`GET /api/events` and `GET /api/characters`, both admin-gated; an admin login carries
the `user` role too, which covers the rest of the chain. A player token can only see its
own characters, so the game reports `ForbiddenError` and tells you to use an admin token.

Tokens are UUIDv4, **expire after 24 hours**, and are invalidated when that account logs
in again elsewhere — so `.env` needs refreshing periodically. `.env` is gitignored; never
commit it.

Check the connection without launching the game:

```bash
python probe.py "Bob"
#   event ......... Hoogzomer (#3)
#   character ..... Bob (Yodi)
#   version ....... Bob v2 (#12)
#   hacking xp .... 80
#   sequence ...... 3 signals
```

### Which version counts

A character has one version per event. The game uses the version registered for the
**most recent event with status `Live`** — latest start time, ties broken by highest id.
A character who is not registered for that event cannot play.

### Difficulty

Sequence length comes from the character's hacking experience. Bands include their lower
bound, so a character sitting exactly on a boundary lands in the easier band.

| Hacking XP | Sequence length |
| :--------- | :-------------- |
| 100        | 2               |
| 80–99      | 3               |
| 60–79      | 4               |
| 40–59      | 5               |
| 20–39      | 6               |
| 0–19       | 7               |

Expertise rows are deleted when their value drops to 0, so a character who has never
bought hacking simply has no entry — that counts as 0, the hardest band.

## Controls

| Key                   | Action                                    |
| :-------------------- | :---------------------------------------- |
| `U` `D` `L` `R`       | Play the up / down / left / right signal   |
| Arrow keys            | Same as the letters                       |
| `ENTER`               | Start a run, or restart after a failure   |
| `ESC`                 | Quit                                      |
| any key (boot screen) | Skip the intro transmission               |

Getting a signal wrong — or letting the timer bar run out — ends the run. Your best score
is kept in `highscore.json` next to `main.py` (gitignored).

## Layout

```
main.py               entry point
probe.py              CLI to check the API chain without launching the game
simon/theme.py        palette, pad specs, layout and timing constants
simon/crt.py          scanline + vignette overlays, phosphor glow text
simon/widgets.py      ASCII progress bar, glowing frames, spaced labels, boot sequence
simon/pads.py         the four signal pads and their cross layout
simon/game.py         state machine and main loop
simon/scores.py       high score persistence
simon/config.py       .env loading
simon/api.py          read-only Terra Prime API client
simon/difficulty.py   hacking experience -> sequence length
```

## Styling notes

Colours are ported from `site/src/lib/styles/theme.css`, and the screen effects from
`site/src/routes/codex/+page.svelte`:

- Scanlines: a 4px period with one row at 15% black, matching the site's
  `repeating-linear-gradient`. On by default.
- Phosphor glow: approximates `text-shadow: 0 0 4px, 0 0 10px, 0 0 20px` by blitting the
  glyph in `#00ff41` around a ring of offsets. Cached, since rebuilding it per frame is
  measurable in the frame time.
- Vignette: available in `crt.py` but off by default, matching `effects-manager.svelte.ts`.
- CRT barrel distortion is **not** ported. It is off by default on the site and would be
  expensive to do per-frame in pure pygame.

Note that `theme.css` has two dead custom-property references — `--phosphor-glow-color` is
missing its semicolon and `--phosphor-glow-shadow` refers to `var(---phosphor-glow-color)`
with three dashes. This game uses the *intended* values.
