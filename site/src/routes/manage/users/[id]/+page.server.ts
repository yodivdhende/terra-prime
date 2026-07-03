import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const response = await fetch(`/api/users/${params.id}`);
    if (!response.ok) return { user: null };
    return { user: await response.json() };
};
