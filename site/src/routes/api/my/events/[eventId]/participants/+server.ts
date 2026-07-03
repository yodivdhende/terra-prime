import { characterRepo } from '$lib/db/character.repo';
import {
  characterVersionRepo,
  isCharacterVersionBare,
  type CharacterVersionBare,
} from '$lib/db/character_version.repo';
import { eventParticipantsRepo } from '$lib/db/event_participants.repo';
import { itemRepo } from '$lib/db/items.repo';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuard, authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

type CharacterWithVersions = {
  id: number | null;
  name: string;
  ownerId: number;
  ownerName: string;
  backstoryId?: string | null;
  versions: CharacterVersionBare[];
};

export const GET: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
    const eventId = isNumberOrError(params.eventId);
    const participation = await eventParticipantsRepo.getUserParticipation({ eventId, userId });
    if (!participation) return new Response(null, { status: 204 });
    return json(participation);
  });
};

export const PUT: RequestHandler = async ({ cookies, params, request }) => {
  return handleRequest(async () => {
    const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
    const eventId = isNumberOrError(params.eventId);
    const body = await request.json();
    if (!isCharacterWithVersions(body)) throw new BadRequest();

    const [characterId, existingParticipation] = await Promise.all([
      characterRepo.save(
        body.id == null
          ? { name: body.name, ownerId: body.ownerId, backstoryId: body.backstoryId ?? null }
          : {
            id: body.id,
            name: body.name,
            ownerId: body.ownerId,
            ownerName: body.ownerName,
            backstoryId: body.backstoryId ?? null,
          }
      ),
      eventParticipantsRepo.getUserParticipation({ eventId, userId }),
    ]);
    if (characterId == null) throw new BadRequest();

    const lastVersion = body.versions.at(-1);
    if (lastVersion == null) throw new BadRequest();

    if (lastVersion.items.length > 0) {
      const allItems = await itemRepo.getAll();
      const itemMap = new Map(allItems.map((i) => [i.id, i]));
      for (const versionItem of lastVersion.items) {
        const catalogItem = itemMap.get(versionItem.id);
        if (catalogItem?.maxPerCharacter != null && versionItem.count > catalogItem.maxPerCharacter) {
          throw new BadRequest();
        }
      }
    }

    const versionToSave =
      existingParticipation?.characterVersionId === lastVersion.id
        ? lastVersion
        : { ...lastVersion, id: null };

    const characterVersionId = await characterVersionRepo.save({
      ...versionToSave,
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
