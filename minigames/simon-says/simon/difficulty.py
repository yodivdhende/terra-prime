"""Maps a character's Software & Hacking experience onto a sequence length.

A skilled hacker gets a short sequence to repeat; an untrained one gets a long
one. Bands are inclusive of their lower bound, so a character sitting exactly on
a boundary lands in the easier band.
"""

from __future__ import annotations

# (minimum experience, sequence length), highest threshold first.
SEQUENCE_BANDS: tuple[tuple[int, int], ...] = (
    (100, 2),
    (80, 3),
    (60, 4),
    (40, 5),
    (20, 6),
    (0, 7),
)

#: Length used when experience somehow falls below every band.
HARDEST_LENGTH = SEQUENCE_BANDS[-1][1]


def sequence_length_for(experience: int) -> int:
    """Sequence length for `experience`.

    Values above 100 are treated as 100, and negatives as 0, so an unexpected
    number out of the API still yields a playable game.
    """
    for minimum, length in SEQUENCE_BANDS:
        if experience >= minimum:
            return length
    return HARDEST_LENGTH


def band_label(experience: int) -> str:
    """Terminal HUD string, e.g. `HACKING 40 // 5 SIGNALEN`."""
    return f"HACKING {experience:03d} // {sequence_length_for(experience)} SIGNALEN"
