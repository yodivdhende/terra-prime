"""Read-only client for the Terra Prime API.

Resolves a character *name* to that character's Software & Hacking experience for
the version they are currently playing. "Currently" means the version registered
for the most recent event with status `Live`.

The chain, and the role each call needs:

    1. GET /api/events                                        admin
    2. GET /api/characters                                    admin
    3. GET /api/characters/{characterId}/events/{eventId}     user
    4. GET /api/characters/versions/{versionId}/full          user

So the configured token must belong to an **admin** account -- an admin login
carries both roles, a player login only carries `user`.

Authentication is the `session-token` cookie, not a bearer header, so the cookie
is set once in the constructor and there is no login round-trip.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests

from .config import Config

#: Seed id of `Software & Hacking`. Production ids are AUTO_INCREMENT, so this is
#: only a fallback -- the name match below is the primary.
HACKING_EXPERTISE_ID = 6
HACKING_NAME_FRAGMENT = "hack"

LIVE_STATUS = "Live"

#: Per-request timeout, (connect, read). A hung socket must surface as an error
#: rather than a frozen game.
TIMEOUT = (3.05, 10)


# --- errors ------------------------------------------------------------------


class TerraPrimeError(Exception):
    """Base for everything this module raises."""


class NetworkError(TerraPrimeError):
    """The instance could not be reached at all."""


class ApiError(TerraPrimeError):
    """The instance answered, but with an unusable status or shape."""


class AuthError(TerraPrimeError):
    """The session token is missing, expired or unknown (401)."""


class ForbiddenError(TerraPrimeError):
    """The token is valid but lacks the role for this call (403).

    In practice: a player token being used where admin is required.
    """


class NoLiveEventError(TerraPrimeError):
    """No event currently has status `Live`."""


class CharacterNotFoundError(TerraPrimeError):
    """No character matches the given name."""


class NotInLiveEventError(TerraPrimeError):
    """The character exists but is not registered for the live event."""


class AmbiguousCharacterError(TerraPrimeError):
    """Several characters share the name; the caller must pick one."""

    def __init__(self, name: str, candidates: list["CharacterRef"]) -> None:
        owners = ", ".join(f"{c.name} ({c.owner_name})" for c in candidates)
        super().__init__(f"{len(candidates)} characters named {name!r}: {owners}")
        self.name = name
        self.candidates = candidates


# --- value types -------------------------------------------------------------


@dataclass(frozen=True)
class LiveEvent:
    id: int
    name: str
    start: str


@dataclass(frozen=True)
class CharacterRef:
    id: int
    name: str
    owner_name: str


@dataclass(frozen=True)
class ActiveCharacter:
    id: int
    name: str
    owner_name: str
    version_id: int
    version_name: str
    event_id: int
    event_name: str
    hacking_xp: int


# --- helpers -----------------------------------------------------------------


def _require_list(payload: Any, what: str) -> list[Any]:
    if not isinstance(payload, list):
        raise ApiError(f"expected a list of {what}, got {type(payload).__name__}")
    return payload


def _require_dict(payload: Any, what: str) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ApiError(f"expected {what} object, got {type(payload).__name__}")
    return payload


def hacking_xp_from_expertise(expertise: Any) -> int:
    """Pull the hacking value out of a resolved `expertise[]` array.

    Matches on the name first (`Software & Hacking`), falling back to the seed id.
    A character who has never bought hacking has no row at all -- the site deletes
    the row when a value drops to 0 -- so an absent entry means 0, not an error.
    """
    entries = _require_list(expertise, "expertise entries")

    by_id: int | None = None
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        value = entry.get("value")
        if not isinstance(value, int):
            continue

        name = entry.get("name")
        if isinstance(name, str) and HACKING_NAME_FRAGMENT in name.casefold():
            return value
        if entry.get("id") == HACKING_EXPERTISE_ID:
            by_id = value

    return by_id if by_id is not None else 0


# --- client ------------------------------------------------------------------


class TerraPrimeClient:
    def __init__(self, config: Config, session: requests.Session | None = None) -> None:
        self.config = config
        self.session = session or requests.Session()
        self.session.cookies.set("session-token", config.token)
        self._events: list[dict[str, Any]] | None = None
        self._characters: list[dict[str, Any]] | None = None

    # -- transport --

    def _get(self, path: str) -> Any:
        url = f"{self.config.base_url}{path}"
        try:
            response = self.session.get(url, timeout=TIMEOUT)
        except requests.RequestException:
            # Deliberately does not interpolate the underlying exception, whose
            # repr can carry the request headers and therefore the token.
            raise NetworkError(f"could not reach {url}") from None

        if response.status_code == 401:
            raise AuthError("session token is expired or unknown")
        if response.status_code == 403:
            raise ForbiddenError(
                f"the session token lacks the role needed for {path} "
                f"-- it must come from an admin account"
            )
        if response.status_code >= 400:
            raise ApiError(f"{path} returned HTTP {response.status_code}")

        try:
            return response.json()
        except ValueError:
            raise ApiError(f"{path} did not return JSON") from None

    # -- steps --

    def live_event(self) -> LiveEvent:
        """The most recent event with status `Live`.

        There is no `/api/events/live` endpoint -- `/api/events/open` hardcodes
        the `Open` status -- so the filtering happens here. "Most recent" is the
        latest start time, tie-broken by the highest id.
        """
        if self._events is None:
            self._events = _require_list(self._get("/api/events"), "events")

        live = [
            event
            for event in self._events
            if isinstance(event, dict)
            and event.get("status") == LIVE_STATUS
            and isinstance(event.get("id"), int)
        ]
        if not live:
            raise NoLiveEventError("no event currently has status Live")

        latest = max(live, key=lambda e: (str(e.get("start") or ""), e["id"]))
        return LiveEvent(
            id=latest["id"],
            name=str(latest.get("name") or f"event {latest['id']}"),
            start=str(latest.get("start") or ""),
        )

    def find_characters(self, name: str) -> list[CharacterRef]:
        """Every character whose name matches `name`, case-insensitively.

        `Characters.Name` has no uniqueness constraint, so this can legitimately
        return more than one.
        """
        if self._characters is None:
            self._characters = _require_list(self._get("/api/characters"), "characters")

        wanted = name.strip().casefold()
        matches = []
        for character in self._characters:
            if not isinstance(character, dict):
                continue
            if not isinstance(character.get("id"), int):
                continue
            character_name = character.get("name")
            if not isinstance(character_name, str):
                continue
            if character_name.strip().casefold() != wanted:
                continue
            matches.append(
                CharacterRef(
                    id=character["id"],
                    name=character_name,
                    owner_name=str(character.get("ownerName") or "onbekend"),
                )
            )
        return matches

    def version_for_event(self, character_id: int, event_id: int) -> dict[str, Any]:
        """The character version registered for `event_id`."""
        payload = _require_dict(
            self._get(f"/api/characters/{character_id}/events/{event_id}"),
            "character version",
        )
        version = payload.get("characterVersion")
        if version is None:
            raise NotInLiveEventError(
                f"character {character_id} is not registered for event {event_id}"
            )
        version = _require_dict(version, "character version")
        if not isinstance(version.get("id"), int):
            raise ApiError("character version has no usable id")
        return version

    def version_full(self, version_id: int) -> dict[str, Any]:
        """A version with its expertise resolved to names and values."""
        return _require_dict(
            self._get(f"/api/characters/versions/{version_id}/full"), "character version"
        )

    # -- the whole chain --

    def active_character(self, name: str, character_id: int | None = None) -> ActiveCharacter:
        """Resolve `name` to the character's live-event version and hacking XP.

        Pass `character_id` to disambiguate when a previous call raised
        `AmbiguousCharacterError`.
        """
        event = self.live_event()
        matches = self.find_characters(name)

        if not matches:
            raise CharacterNotFoundError(f"no character named {name!r}")

        if character_id is not None:
            chosen = next((c for c in matches if c.id == character_id), None)
            if chosen is None:
                raise CharacterNotFoundError(
                    f"no character named {name!r} with id {character_id}"
                )
        elif len(matches) > 1:
            raise AmbiguousCharacterError(name, matches)
        else:
            chosen = matches[0]

        version = self.version_for_event(chosen.id, event.id)
        full = self.version_full(version["id"])

        return ActiveCharacter(
            id=chosen.id,
            name=chosen.name,
            owner_name=chosen.owner_name,
            version_id=version["id"],
            version_name=str(full.get("name") or version.get("name") or ""),
            event_id=event.id,
            event_name=event.name,
            hacking_xp=hacking_xp_from_expertise(full.get("expertise", [])),
        )
