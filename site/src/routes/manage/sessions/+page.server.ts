import { getSessionToken } from '$lib/utils/cookies';
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad= async ({fetch, cookies}) => {
	const response = await fetch('/api/sessions', {method: 'GET'});
	const sessions = await response.json();
	const sessionToken = getSessionToken(cookies);
	return {sessions, sessionToken} 
};

