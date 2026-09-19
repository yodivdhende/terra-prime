import { UnAutherizedRequestError } from "$lib/types/errors";
import type { Cookies } from "@sveltejs/kit";

// SvelteKit's own default marks the cookie `secure` for any hostname other than
// exactly `localhost`, regardless of whether the connection is actually HTTPS.
// That breaks self-hosted deployments served over plain HTTP (e.g. reached by
// LAN IP), where the browser silently drops a `Secure` cookie: login appears to
// succeed but no session cookie is ever stored. Set COOKIE_SECURE=false in such
// a deployment's env to opt out; leave it unset everywhere else (local dev and
// TLS-terminated deployments like Railway keep SvelteKit's default).
const cookieSecure = process.env.COOKIE_SECURE === 'false' ? false : undefined;

export function setSessionToken(cookies: Cookies, token: string) {
  cookies.set('session-token', token, {
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'strict',
    ...(cookieSecure !== undefined ? { secure: cookieSecure } : {}),
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
