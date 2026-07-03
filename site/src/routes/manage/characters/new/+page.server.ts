import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    const response = await fetch('/api/users');
    const users = response.ok ? await response.json() : [];
    return { users };
};
