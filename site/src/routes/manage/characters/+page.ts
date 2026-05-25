import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
    const response = await fetch('/api/characters');
    return { characters: await response.json() };
};
