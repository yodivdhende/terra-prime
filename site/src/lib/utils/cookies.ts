import { UnAutherizedRequestError } from "$lib/types/errors";
import type { Cookies } from "@sveltejs/kit";

export function setSessionToken(cookies: Cookies, token: string) {
  cookies.set('session-token', token, {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'strict',
  });
}

export function getSessionToken(cookies: Cookies) {
  const token = cookies.get('session-token');
  if (token == null) throw new UnAutherizedRequestError();
  return token;
}

export function setPotentialSessionToken(cookies: Cookies) {
  return cookies.get('session-token');
}
