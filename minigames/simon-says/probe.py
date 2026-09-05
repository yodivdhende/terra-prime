#!/usr/bin/env python3
"""Resolve a character's live hacking experience against a real Terra Prime instance.

    python probe.py "Bob"

Reads TERRA_PRIME_URL and TERRA_PRIME_TOKEN from `.env` (see `.env.example`).
Useful for checking the API chain without launching the game.
"""

from __future__ import annotations

import sys

from simon import api, difficulty
from simon.config import Config, ConfigError


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__)
        return 2
    name = argv[1]

    try:
        client = api.TerraPrimeClient(Config.from_env())
        character = client.active_character(name)
    except api.AmbiguousCharacterError as exc:
        print(f"! {exc}")
        print("  pass one of these ids to active_character(name, character_id=...)")
        for candidate in exc.candidates:
            print(f"    {candidate.id:>4}  {candidate.name}  ({candidate.owner_name})")
        return 1
    except (ConfigError, api.TerraPrimeError) as exc:
        print(f"! {type(exc).__name__}: {exc}")
        return 1

    length = difficulty.sequence_length_for(character.hacking_xp)
    print(f"  event ......... {character.event_name} (#{character.event_id})")
    print(f"  character ..... {character.name} ({character.owner_name})")
    print(f"  version ....... {character.version_name} (#{character.version_id})")
    print(f"  hacking xp .... {character.hacking_xp}")
    print(f"  sequence ...... {length} signals")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
