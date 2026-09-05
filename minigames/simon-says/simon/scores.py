"""High score persistence.

Deliberately forgiving: a missing, corrupt or unwritable file degrades to a score of
zero rather than taking the game down with it.
"""

from __future__ import annotations

import json
from pathlib import Path

SCORE_FILE = Path(__file__).resolve().parent.parent / "highscore.json"


def load(path: Path = SCORE_FILE) -> int:
    try:
        data = json.loads(path.read_text())
        return max(0, int(data["high_score"]))
    except (OSError, ValueError, KeyError, TypeError):
        return 0


def save(score: int, path: Path = SCORE_FILE) -> bool:
    """Persist `score`. Returns whether it was actually written."""
    try:
        path.write_text(json.dumps({"high_score": int(score)}, indent=2) + "\n")
        return True
    except (OSError, ValueError, TypeError):
        return False
