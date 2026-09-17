import { characterRepo } from '$lib/db/character.repo';
import {
  characterVersionRepo,
  isCharacterVersionBare,
  type CharacterVersionBare,
} from '$lib/db/character_version.repo';
import { eventPlayersRepo, isEventPlayer } from '$lib/db/event_players.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest, NotFoundRequest } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

type CharacterWithVersions = {
  id: number | null;
  name: string;
  ownerId: number;
  ownerName: string;
  versions: CharacterVersionBare[];
};

function isCharacterWithVersions(value: unknown): value is CharacterWithVersions {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    (value.id === null || typeof value.id === 'number') &&
    'name' in value &&
    typeof value.name === 'string' &&
    'ownerId' in value &&
    typeof value.ownerId === 'number' &&
    'ownerName' in value &&
    typeof value.ownerName === 'string' &&
    'versions' in value &&
    Array.isArray(value.versions) &&
    value.versions.every(isCharacterVersionBare)
  );
}

type ParticipantVersionBody = {
  characterVersionId: number;
};

function isParticipantVersionBody(value: unknown): value is ParticipantVersionBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    'characterVersionId' in value &&
    typeof value.characterVersionId === 'number'
  );
}

export const GET: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    await authGuardForUser(getSessionToken(cookies), ['admin']);
    const { eventId } = params;
    const numberId = isNumberOrError(eventId);
    return json(await eventPlayersRepo.getPlayers({ eventId: numberId }));
  });
};

/**
 * Attach an *existing* character version to an event. `PUT` above is character-shaped — it clones
 * the last version into a new one — so linking a version an organiser picked from a list needs its
 * own verb. The owner is derived from the version server-side; the client never supplies a userId.
 */
export const POST: RequestHandler = async ({ cookies, params, request }) => {
  return handleRequest(async () => {
    await authGuard(getSessionToken(cookies), ['admin']);
    const eventId = isNumberOrError(params.eventId);
    const body = await request.json();
    if (!isParticipantVersionBody(body)) throw new BadRequest();

    const version = await characterVersionRepo.getWithId(body.characterVersionId);
    if (version == null) throw new NotFoundRequest('character version not found');
    const character = await characterRepo.getById(version.characterId);

    // `Event_Participants` is keyed on (Event, User), so a second version for the same owner would
    // silently replace the first. Refuse instead and let the admin remove the existing row.
    const existingParticipation = await eventPlayersRepo.getPlayerForUser({
      eventId,
      userId: character.ownerId,
    });
    if (existingParticipation != null)
      throw new BadRequest('owner already participates in this event');

    await eventPlayersRepo.participate({
      eventId,
      userId: character.ownerId,
      characterVersionId: body.characterVersionId,
    });

    return new Response();
  });
};

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
  return handleRequest(async () => {
    await authGuard(getSessionToken(cookies), ['admin']);
    const eventId = isNumberOrError(params.eventId);
    const body = await request.json();
    if (!isCharacterWithVersions(body)) throw new BadRequest();

    const [characterId, existingParticipation] = await Promise.all([
      characterRepo.save(
        body.id == null
          ? { name: body.name, ownerId: body.ownerId }
          : {
            id: body.id,
            name: body.name,
            ownerId: body.ownerId,
            ownerName: body.ownerName,
          }
      ),
      eventPlayersRepo.getPlayerForUser({ eventId, userId: body.ownerId }),
    ]);
    if (characterId == null) throw new BadRequest();

    const lastVersion = body.versions.at(-1);
    if (lastVersion == null) throw new BadRequest();

    const versionToSave =
      existingParticipation?.characterVersionId === lastVersion.id
        ? lastVersion
        : { ...lastVersion, id: null };

    const characterVersionId = await characterVersionRepo.save({
      ...versionToSave,
      characterId,
    });

    await eventPlayersRepo.participate({
      eventId,
      userId: body.ownerId,
      characterVersionId,
    });

    return new Response();
  });
};

export const DELETE: RequestHandler = async ({ cookies, request }) => {
  return handleRequest(async () => {
    await authGuard(getSessionToken(cookies), ['admin']);
    const body = await request.json();
    if (isEventPlayer(body) == false) throw new BadRequest();
    await eventPlayersRepo.withdraw({ eventId: body.eventId, characterVersionId: body.characterVersion });
    return new Response();
  });
};



