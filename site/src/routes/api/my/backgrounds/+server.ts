import { characterRepo } from '$lib/db/character.repo';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
  return handleRequest(async () => {
    const { userId } = await authGuardForUser(getSessionToken(cookies), ['user']);
    const characters = await characterRepo.getForUser(userId);

    const backgrounds = (characters ?? [])
      .filter((c: { backstoryId?: string | null }) => c.backstoryId)
      .map((c: { backstoryId?: string | null; name: string }) => ({
        id: c.backstoryId,
        name: `${c.name} - Backstory`,
        mimeType: 'application/vnd.google-apps.document',
      }));

    return json(backgrounds);
  });
};
