import { characterRepo } from '$lib/db/character.repo';
import {
  characterVersionRepo,
  isCharacterVersionBare,
  type CharacterVersionBare,
} from '$lib/db/character_version.repo';
import { eventCouponRepo } from '$lib/db/event_coupon.repo';
import { eventExtrasRepo } from '$lib/db/event_extras.repo';
import { eventPlayersRepo } from '$lib/db/event_players.repo';
import { itemRepo } from '$lib/db/items.repo';
import { computeCharacterVersionCost, getAvailableBudget } from '$lib/server/budget.service';
import { isNumberOrError } from '$lib/request.utils';
import { BadRequest } from '$lib/types/errors';
import { UserRole } from '$lib/types/roles';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

type CharacterWithVersions = {
  id: number | null;
  name: string;
  ownerId: number;
  ownerName: string;
  backstoryId?: string | null;
  versions: CharacterVersionBare[];
  couponCode?: string | null;
};

/** The current user's enrolment, whichever kind it is; 204 when they have none. */
export const GET: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
    const eventId = isNumberOrError(params.eventId);
    const [player, extra] = await Promise.all([
      eventPlayersRepo.getPlayerForUser({ eventId, userId }),
      eventExtrasRepo.getEnrolment({ eventId, userId }),
    ]);
    if (player) return json({ type: 'player' as const, ...player });
    if (extra) return json({ type: 'extra' as const });
    return new Response(null, { status: 204 });
  });
};

/**
 * Sign up as an extra. An extra does not build a character, so there is no budget, no coupon and
 * no version here — the organisation assigns NPCs later from the event manage page.
 */
export const POST: RequestHandler = async ({ cookies, params, request }) => {
  return handleRequest(async () => {
    const { userId } = await authGuardForUser(getSessionToken(cookies), [UserRole.user]);
    const eventId = isNumberOrError(params.eventId);
    const body = await request.json();
    if (body?.type !== 'extra') throw new BadRequest();
    await eventExtrasRepo.enrol({ eventId, userId });
    return json({ ok: true });
  });
};

export const PUT: RequestHandler = async ({ cookies, params, request, locals }) => {
  return handleRequest(async () => {
    const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
    const eventId = isNumberOrError(params.eventId);
    const body = await request.json();
    if (!isCharacterWithVersions(body)) throw new BadRequest();

    // NPCs are handed out through the extras endpoints; a player cannot register one as their own.
    if (body.id != null) {
      const existing = await characterRepo.getById(body.id);
      if (existing.kind === 'npc')
        throw new BadRequest('npc characters cannot be registered as a player');
    }

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
      eventPlayersRepo.getPlayerForUser({ eventId, userId }),
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

    const couponCode = typeof body?.couponCode === 'string' ? body.couponCode.trim() : '';
    if (couponCode && !locals.featureFlags['Coupons']) throw new BadRequest('coupon codes are disabled');
    const coupon = couponCode
      ? await eventCouponRepo.findUnredeemedByCode(eventId, userId, couponCode)
      : undefined;
    if (couponCode && coupon == null) throw new BadRequest('invalid or already used coupon code');

    const [availableBudget, cost] = await Promise.all([
      getAvailableBudget({ eventId, characterId, ownerId: userId }),
      computeCharacterVersionCost(lastVersion),
    ]);
    if (cost > availableBudget + (coupon?.value ?? 0)) throw new BadRequest('character exceeds available budget');

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

    if (coupon != null) await eventCouponRepo.redeem(coupon.id);

    return json({ characterId });
  });
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
