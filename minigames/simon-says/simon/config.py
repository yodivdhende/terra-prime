"""Runtime configuration, read from a `.env` file next to `main.py`.

Real environment variables win over the file, so a one-off run can override
without editing it.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

ENV_FILE = Path(__file__).resolve().parent.parent / ".env"

URL_VAR = "TERRA_PRIME_URL"
TOKEN_VAR = "TERRA_PRIME_TOKEN"

DEFAULT_URL = "http://localhost:5173"


class ConfigError(RuntimeError):
    """Configuration is missing or unusable."""


@dataclass(frozen=True)
class Config:
    base_url: str
    token: str

    @classmethod
    def from_env(cls, env_file: Path = ENV_FILE) -> "Config":
        # override=False so an exported variable beats the file.
        load_dotenv(env_file, override=False)

        token = (os.environ.get(TOKEN_VAR) or "").strip()
        if not token:
            raise ConfigError(
                f"{TOKEN_VAR} is not set. Copy .env.example to .env and fill in a "
                f"session token from an admin account."
            )

        base_url = (os.environ.get(URL_VAR) or DEFAULT_URL).strip().rstrip("/")
        if not base_url:
            raise ConfigError(f"{URL_VAR} is empty. Use e.g. {DEFAULT_URL}.")

        return cls(base_url=base_url, token=token)

    def __repr__(self) -> str:
        # The token is a live credential: keep it out of tracebacks and logs.
        return f"Config(base_url={self.base_url!r}, token=<redacted>)"
