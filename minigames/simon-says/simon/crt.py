"""CRT screen effects, ported from `site/src/routes/codex/+page.svelte`.

The site exposes these as toggles in `effects-manager.svelte.ts` with the defaults
`scanlines=true`, `vignette=false`, `crt=false`. The barrel-distortion filter (the
`feDisplacementMap` behind the `crt` toggle) is deliberately not ported.
"""

from __future__ import annotations

import pygame

# Offsets approximating `text-shadow: 0 0 4px, 0 0 10px, 0 0 20px`: a tight ring for
# the sharp inner glow, a wider one for the soft halo.
_GLOW_RING_INNER = ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, -1), (-1, 1), (1, 1))
_GLOW_RING_OUTER = ((-3, 0), (3, 0), (0, -3), (0, 3), (-2, -2), (2, -2), (-2, 2), (2, 2))

_scanline_cache: dict[tuple[int, int], pygame.Surface] = {}
_vignette_cache: dict[tuple[int, int], pygame.Surface] = {}
_text_cache: dict[tuple, pygame.Surface] = {}


def scanlines(size: tuple[int, int]) -> pygame.Surface:
    """A full-screen scanline overlay, built once per size.

    Mirrors the site's `repeating-linear-gradient(transparent 0-3px,
    rgba(0, 0, 0, 0.15) 3-4px)`: a 4px period with a single dark row at 15% black.
    """
    cached = _scanline_cache.get(size)
    if cached is not None:
        return cached

    overlay = pygame.Surface(size, pygame.SRCALPHA)
    width, height = size
    for y in range(3, height, 4):
        pygame.draw.line(overlay, (0, 0, 0, 38), (0, y), (width, y))
    _scanline_cache[size] = overlay
    return overlay


def vignette(size: tuple[int, int]) -> pygame.Surface:
    """A radial darkening overlay: clear to 40% of the radius, then ramping to 60% black.

    Mirrors `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)`.
    Drawn as concentric ellipses from the outside in, which is cheap enough to build
    once at startup.
    """
    cached = _vignette_cache.get(size)
    if cached is not None:
        return cached

    width, height = size
    overlay = pygame.Surface(size, pygame.SRCALPHA)
    steps = 48
    for i in range(steps):
        # t walks 1.0 -> 0.0, i.e. the screen edge inwards to the clear centre.
        t = 1.0 - i / steps
        if t <= 0.4:
            break
        strength = (t - 0.4) / 0.6
        alpha = int(153 * strength / steps * 6)
        rect = pygame.Rect(0, 0, int(width * t * 1.45), int(height * t * 1.45))
        rect.center = (width // 2, height // 2)
        pygame.draw.ellipse(overlay, (0, 0, 0, min(255, alpha)), rect, width=max(12, height // steps))
    _vignette_cache[size] = overlay
    return overlay


def glow_text(
    font: pygame.font.Font,
    text: str,
    color: tuple[int, int, int],
    glow: tuple[int, int, int],
    strength: float = 1.0,
) -> pygame.Surface:
    """Render `text` with a phosphor halo around it.

    Results are cached — rebuilding these every frame is expensive enough to show up
    in the frame time.
    """
    key = (id(font), text, color, glow, round(strength, 2))
    cached = _text_cache.get(key)
    if cached is not None:
        return cached

    core = font.render(text, True, color)
    pad = 5
    surface = pygame.Surface((core.get_width() + pad * 2, core.get_height() + pad * 2), pygame.SRCALPHA)

    for ring, alpha in ((_GLOW_RING_OUTER, 26), (_GLOW_RING_INNER, 52)):
        layer = font.render(text, True, glow)
        layer.set_alpha(int(alpha * strength))
        for dx, dy in ring:
            surface.blit(layer, (pad + dx, pad + dy))

    surface.blit(core, (pad, pad))
    _text_cache[key] = surface
    return surface
