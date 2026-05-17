import { characterRepo } from '$lib/db/character.repo';
import {
  characterVersionRepo,
  isCharacterVersionBare,
  type CharacterVersionBare,
} from '$lib/db/character_version.repo';
import { eventParticipantsRepo, isEventParticapant } from '$lib/db/event_participants.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
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
    ((value as any).id === null || typeof (value as any).id === 'number') &&
    'name' in value &&
    typeof (value as any).name === 'string' &&
    'ownerId' in value &&
    typeof (value as any).ownerId === 'number' &&
    'ownerName' in value &&
    typeof (value as any).ownerName === 'string' &&
    'versions' in value &&
    Array.isArray((value as any).versions) &&
    (value as any).versions.every(isCharacterVersionBare)
  );
}

export const GET: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    await authGuardForUser(getSessionToken(cookies), ['admin']);
    const { id: eventId } = params;
    const numberId = isNumberOrError(eventId);
    return json(await eventParticipantsRepo.getPerticipants({ eventId: numberId }));
  });
};

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
  return handleRequest(async () => {
    await authGuard(getSessionToken(cookies), ['admin']);
    const eventId = isNumberOrError(params.eventId);
    const body = await request.json();
    if (!isCharacterWithVersions(body)) throw new BadRequest();

    const characterId = await characterRepo.save(
      body.id == null
        ? { name: body.name, ownerId: body.ownerId }
        : {
          id: body.id,
          name: body.name,
          ownerId: body.ownerId,
          ownerName: body.ownerName,
        }
    );
    if (characterId == null) throw new BadRequest();

    const lastVersion = body.versions.at(-1);
    if (lastVersion == null) throw new BadRequest();
    const characterVersionId = await characterVersionRepo.save({
      ...lastVersion,
      characterId,
    });

    await eventParticipantsRepo.participate({
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
    if (isEventParticapant(body) == false) throw new BadRequest();
    await eventParticipantsRepo.withdraw({ eventId: body.eventId, characterVersionId: body.characterVersion });
    return new Response();
  });
};



