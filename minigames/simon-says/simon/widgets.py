"""Reusable terminal widgets: ASCII bars, glowing frames, spaced labels, boot text."""

from __future__ import annotations

import pygame

from . import crt, theme


def ascii_progress_bar(value: float, max_value: float, width: int = 20) -> str:
    """`[####........]` — mirrors `site/src/lib/components/ascii-progress-bar.svelte`.

    Filled cells are `#`, empty cells are `.`, wrapped in square brackets. The Svelte
    component draws the empty run at `opacity: 0.3`; `draw_progress_bar` below does the
    same with alpha.
    """
    if max_value <= 0:
        filled = 0
    else:
        filled = int(round(max(0.0, min(1.0, value / max_value)) * width))
    return "[" + "#" * filled + "." * (width - filled) + "]"


def draw_progress_bar(
    surface: pygame.Surface,
    center: tuple[int, int],
    value: float,
    max_value: float,
    color: tuple[int, int, int],
    width: int = 20,
) -> None:
    """Draw an ASCII bar with the empty run dimmed, as the Svelte component does."""
    font = theme.font(theme.SIZE_BODY)
    text = ascii_progress_bar(value, max_value, width)

    cell = font.size("#")[0]
    total = font.size(text)[0]
    x = center[0] - total // 2
    y = center[1] - font.get_height() // 2

    for i, char in enumerate(text):
        if char == ".":
            glyph = font.render(char, True, color)
            glyph.set_alpha(77)  # opacity: 0.3
            surface.blit(glyph, (x + i * cell, y))
        else:
            surface.blit(font.render(char, True, color), (x + i * cell, y))


def draw_frame(
    surface: pygame.Surface,
    rect: pygame.Rect,
    color: tuple[int, int, int],
    glow: tuple[int, int, int] | None = None,
) -> None:
    """A 3px border with an outer halo — mirrors `window.svelte`'s
    `border: 3px solid` + `box-shadow: 0 0 16px`."""
    if glow is not None:
        for i, alpha in ((6, 12), (4, 20), (2, 34)):
            halo = pygame.Surface((rect.width + i * 2, rect.height + i * 2), pygame.SRCALPHA)
            pygame.draw.rect(
                halo,
                (*glow, alpha),
                halo.get_rect(),
                width=theme.BORDER_WIDTH,
                border_radius=10 + i,
            )
            surface.blit(halo, (rect.x - i, rect.y - i))

    pygame.draw.rect(surface, color, rect, width=theme.BORDER_WIDTH, border_radius=10)


def draw_label(
    surface: pygame.Surface,
    text: str,
    center: tuple[int, int],
    color: tuple[int, int, int],
    size: int = theme.SIZE_LABEL,
    spacing: int = 3,
    alpha: int = 255,
) -> None:
    """Uppercase, letter-spaced text — the site's convention for every small label
    (`text-transform: uppercase; letter-spacing: 0.05em-0.1em`)."""
    font = theme.font(size)
    text = text.upper()
    glyphs = [font.render(char, True, color) for char in text]
    total = sum(g.get_width() for g in glyphs) + spacing * max(0, len(glyphs) - 1)

    x = center[0] - total // 2
    y = center[1] - font.get_height() // 2
    for glyph in glyphs:
        if alpha < 255:
            glyph.set_alpha(alpha)
        surface.blit(glyph, (x, y))
        x += glyph.get_width() + spacing


def draw_glow_line(
    surface: pygame.Surface,
    text: str,
    center: tuple[int, int],
    color: tuple[int, int, int],
    glow: tuple[int, int, int],
    size: int = theme.SIZE_BODY,
) -> pygame.Rect:
    """Centre a single line of phosphor-glowing text. Returns the blitted rect."""
    rendered = crt.glow_text(theme.font(size), text, color, glow)
    rect = rendered.get_rect(center=center)
    surface.blit(rendered, rect)
    return rect


class BootSequence:
    """Typewriter reveal of a transmission banner.

    The framing (`+++ [ FEDERATIE TRANSMISSIE ONTVANGEN ] +++`) is lifted from
    `site/src/lib/components/info.svelte`, and the character-at-a-time reveal from
    `code-scroller.svelte`. Skippable with any key.
    """

    LINES = (
        "+++ [ FEDERATIE TRANSMISSIE ONTVANGEN ] +++",
        "",
        "  KANAAL........: 07 / BEVEILIGD",
        "  PROTOCOL......: SIMON-4",
        "  STATUS........: SIGNAALTEST VEREIST",
        "",
        "  HERHAAL DE UITGEZONDEN SEQUENTIE.",
        "  ELKE RONDE VOEGT EEN SIGNAAL TOE.",
        "",
        "+++ [ EINDE TRANSMISSIE ] +++",
    )

    CHAR_MS = 12
    HOLD_MS = 900

    def __init__(self) -> None:
        self.elapsed = 0.0
        self.skipped = False

    @property
    def total_chars(self) -> int:
        return sum(len(line) for line in self.LINES)

    def update(self, delta: float) -> None:
        self.elapsed += delta

    def skip(self) -> None:
        self.skipped = True

    @property
    def done(self) -> bool:
        if self.skipped:
            return True
        return self.elapsed >= self.total_chars * self.CHAR_MS + self.HOLD_MS

    def draw(self, surface: pygame.Surface) -> None:
        budget = int(self.elapsed / self.CHAR_MS)
        font = theme.font(theme.SIZE_BODY)
        y = theme.HEIGHT // 2 - (len(self.LINES) * (font.get_height() + 6)) // 2

        left = theme.WIDTH // 2 - 300
        caret = (left, y)

        for line in self.LINES:
            if budget <= 0 and line:
                break
            shown = line[:budget]
            budget -= len(line)
            if shown:
                rendered = crt.glow_text(font, shown, theme.ACCENT, theme.PHOSPHOR)
                surface.blit(rendered, (left, y))
            # Park the caret after the last text actually revealed.
            caret = (left + font.size(shown)[0], y)
            y += font.get_height() + 6

        # Blinking block cursor trailing the typewriter.
        if int(self.elapsed / 450) % 2 == 0:
            surface.blit(font.render("\u2588", True, theme.PHOSPHOR), caret)

        draw_label(
            surface,
            "druk op een toets om over te slaan",
            (theme.WIDTH // 2, theme.HEIGHT - 60),
            theme.MAIN_DIM,
            alpha=140,
        )
