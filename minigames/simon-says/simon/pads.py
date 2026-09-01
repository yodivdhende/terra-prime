"""The four signal pads, laid out as a cross so the U/D/L/R keys are self-evident."""

from __future__ import annotations

from dataclasses import dataclass, field

import pygame

from . import crt, theme
from .widgets import draw_frame


@dataclass
class Pad:
    id: str
    key: str
    color: tuple[int, int, int]
    glow: tuple[int, int, int]
    rect: pygame.Rect
    lit_until: int = field(default=0)

    def light(self, now: int, duration: int) -> None:
        self.lit_until = now + duration

    def is_lit(self, now: int) -> bool:
        return now < self.lit_until


def build_pads(center: tuple[int, int]) -> dict[str, Pad]:
    """Place the pads on a 3x3 grid, using only the cross cells."""
    step = theme.PAD_SIZE + theme.PAD_GAP
    pads: dict[str, Pad] = {}

    for pad_id, key, color, glow, col, row in theme.PAD_SPECS:
        rect = pygame.Rect(0, 0, theme.PAD_SIZE, theme.PAD_SIZE)
        rect.center = (center[0] + (col - 1) * step, center[1] + (row - 1) * step)
        pads[pad_id] = Pad(id=pad_id, key=key, color=color, glow=glow, rect=rect)

    return pads


def draw_pad(surface: pygame.Surface, pad: Pad, now: int) -> None:
    """Idle pads are a dim outline; lit pads fill, brighten and glow."""
    lit = pad.is_lit(now)

    if lit:
        fill = pygame.Surface(pad.rect.size, pygame.SRCALPHA)
        pygame.draw.rect(fill, (*pad.color, 70), fill.get_rect(), border_radius=10)
        surface.blit(fill, pad.rect.topleft)
        border = pad.glow
        letter_color = theme.MAIN
        glow_color: tuple[int, int, int] | None = pad.glow
    else:
        border = theme.dim(pad.color, 0.45)
        letter_color = theme.dim(pad.color, 0.75)
        glow_color = None

    draw_frame(surface, pad.rect, border, glow_color)

    glyph = crt.glow_text(
        theme.font(theme.SIZE_PAD),
        pad.key,
        letter_color,
        pad.glow,
        strength=1.0 if lit else 0.35,
    )
    surface.blit(glyph, glyph.get_rect(center=pad.rect.center))
