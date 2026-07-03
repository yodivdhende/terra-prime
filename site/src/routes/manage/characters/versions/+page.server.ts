import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    const res = await fetch('/api/characters/versions');
    const versions = res.ok ? await res.json() : [];
    return { versions };
};
