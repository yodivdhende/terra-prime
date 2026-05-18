import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const [characterResponse, usersResponse] = await Promise.all([
        fetch(`/api/characters/${params.id}`),
        fetch('/api/users')
    ]);
    const character = characterResponse.ok ? await characterResponse.json() : null;
    const users = usersResponse.ok ? await usersResponse.json() : [];
    return { character, users };
};
