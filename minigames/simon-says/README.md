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
main.py            entry point
simon/theme.py     palette, pad specs, layout and timing constants
simon/crt.py       scanline + vignette overlays, phosphor glow text
simon/widgets.py   ASCII progress bar, glowing frames, spaced labels, boot sequence
simon/pads.py      the four signal pads and their cross layout
simon/game.py      state machine and main loop
simon/scores.py    high score persistence
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
