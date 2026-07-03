import { sessionRepo } from "$lib/db/session.repo";
import { NoAccesRequest, RequestError, UnAutherizedRequestError } from "$lib/types/errors";
import type { UserRole } from "$lib/types/roles";
import { error } from "@sveltejs/kit";

export async function handleRequest<T>(cb: () => Promise<T>): Promise<T> {
  try {
    return await cb();
  } catch (err) {
    if (err instanceof RequestError) return err.getError();
    return error(500, `${err}`);
  }
}

export async function authGuard<T extends UserRole[]>(token: string, Roles: T) {
  const userRoleFromToken = await sessionRepo.getCredentials(token);
  if (userRoleFromToken === null) throw new UnAutherizedRequestError();
  const commonRoles: T = Roles.filter(role => userRoleFromToken.roles.includes(role)) as T;
  if (commonRoles.length === 0) throw new NoAccesRequest;

  return { userId: userRoleFromToken.userId, roles: commonRoles };
};

export async function authGuardForUser<T extends UserRole[]>(token: string, Roles: T) {
  const { roles, userId } = await sessionRepo.getCredentials(token) ?? {};
  if (roles == null) throw new UnAutherizedRequestError();
  if (userId == null) throw new UnAutherizedRequestError();
  const commonRoles: T = Roles.filter(role => roles.includes(role)) as T;
  if (commonRoles.length === 0) throw new NoAccesRequest();
  return { userId: userId, roles: commonRoles };
}

export function valueOrLogOfPromiseSetteld<T>(result: PromiseSettledResult<T>): T | null {
  if (result.status === 'rejected') {
    console.error(result.reason);

    return null;
  }
  return result.value;
}
