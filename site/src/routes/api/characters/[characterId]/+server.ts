import { characterRepo, isCharacter, isNewCharacter } from '$lib/db/character.repo';
import { isNumberOrError } from '$lib/request.utils';
import { RequestError } from '$lib/types/errors';
import { getSessionToken } from '$lib/utils/cookies';
import { authGuardForUser, handleRequest } from '$lib/utils/request';
import { type RequestHandler, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    await authGuardForUser(getSessionToken(cookies), ['admin']);
    const { characterId } = params;
    const numberId = isNumberOrError(characterId);
    const character = await characterRepo.getById(numberId);
    return json(character);
  });
};

export const POST: RequestHandler = async ({ cookies, params, request }) => {
  return handleRequest(async () => {
    await authGuardForUser(getSessionToken(cookies), ['admin']);
    const { id } = params;
    isNumberOrError(id);
    const character = await request.json();
    if (isCharacter(character) === false && isNewCharacter(character) === false) {
      throw new RequestError(400, 'body was not of type character');
    }
    await characterRepo.save(character);
    return new Response();
  });
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
  return handleRequest(async () => {
    await authGuardForUser(getSessionToken(cookies), ['admin']);
    const { characterId } = params;
    const numberId = isNumberOrError(characterId);
    await characterRepo.delete(numberId);
    return new Response();
  });
};

