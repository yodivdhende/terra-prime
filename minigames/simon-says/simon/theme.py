"""Palette, layout and fonts, ported from the Terra Prime terminal styling.

Colour values come from `site/src/lib/styles/theme.css` and `terminal-style.css`.
Where the CSS has typos (`var(---phosphor-glow-color)`, `--coor-main`) the *intended*
value is used here.
"""

from __future__ import annotations

import pygame

# --- palette (site/src/lib/styles/theme.css) ---------------------------------

BG = (5, 5, 5)  # --bg
BG_PANEL = (0, 0, 0)  # --color-bg-panel
MAIN = (255, 255, 255)  # --color-main
MAIN_DIM = (170, 170, 170)  # --color-main-dim
MAIN_RESULT = (221, 221, 221)  # --color-main-result
ACCENT = (0, 204, 0)  # --color-accent
PHOSPHOR = (0, 255, 65)  # --phosphor-glow-color
PHOSPHOR_HALO = (0, 59, 0)  # third stop of --phosphor-glow-shadow
WARNING = (204, 68, 68)  # --color-warning
ERROR = (204, 0, 0)  # --color-error
BORDER_DIM = (85, 85, 85)  # --border-color-dim
SCROLLER = (0, 102, 0)  # code-scroller.svelte

BORDER_WIDTH = 3  # --border-width

# --- window ------------------------------------------------------------------

WIDTH = 900
HEIGHT = 700
FPS = 60
CAPTION = "TERRA PRIME // SIMON"

# --- pads --------------------------------------------------------------------

UP, DOWN, LEFT, RIGHT = "UP", "DOWN", "LEFT", "RIGHT"

# (id, key letter, base colour, glow colour, column, row) on a 3x3 cross grid.
PAD_SPECS = (
    (UP, "U", ACCENT, PHOSPHOR, 1, 0),
    (LEFT, "L", (0, 204, 204), (77, 255, 255), 0, 1),
    (RIGHT, "R", WARNING, (255, 107, 107), 2, 1),
    (DOWN, "D", (255, 176, 0), (255, 209, 102), 1, 2),
)

PAD_SIZE = 130
PAD_GAP = 16

# --- timing (milliseconds) ---------------------------------------------------

PLAYBACK_ON_MAX = 600  # round 1
PLAYBACK_ON_MIN = 220  # floor, so it stays playable
PLAYBACK_RAMP = 28  # shaved per round
PLAYBACK_GAP_RATIO = 0.4
PLAYBACK_LEAD_IN = 700  # pause before the sequence starts

PLAYER_FLASH = 180  # how long a pad stays lit on a keypress
ROUND_CLEAR_HOLD = 800
GAME_OVER_FLASH = 400

INPUT_TIME_BASE = 2500  # per-round input budget...
INPUT_TIME_PER_STEP = 900  # ...plus this much for each step in the sequence

# --- fonts -------------------------------------------------------------------

# No font files are bundled in the repo, so resolve a Courier-alike at runtime.
_FONT_STACK = "couriernew,courier,dejavusansmono,liberationmono,freemono,monospace"

_font_cache: dict[int, pygame.font.Font] = {}

SIZE_TITLE = 46
SIZE_PAD = 40
SIZE_BODY = 22
SIZE_LABEL = 16


def font(size: int) -> pygame.font.Font:
    """A monospace font at `size`, cached. Requires pygame.font to be initialised."""
    cached = _font_cache.get(size)
    if cached is None:
        path = pygame.font.match_font(_FONT_STACK)
        cached = pygame.font.Font(path, size) if path else pygame.font.SysFont(None, size)
        _font_cache[size] = cached
    return cached


def dim(color: tuple[int, int, int], factor: float) -> tuple[int, int, int]:
    """Scale a colour towards black. Used for idle pads and muted text."""
    return (
        max(0, min(255, int(color[0] * factor))),
        max(0, min(255, int(color[1] * factor))),
        max(0, min(255, int(color[2] * factor))),
    )
