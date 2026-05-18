import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const [characterResponse, usersResponse, versionsResponse] = await Promise.all([
        fetch(`/api/characters/${params.id}`),
        fetch('/api/users'),
        fetch(`/api/characters/${params.id}/versions`)
    ]);
    const character = characterResponse.ok ? await characterResponse.json() : null;
    const users = usersResponse.ok ? await usersResponse.json() : [];
    const versions = versionsResponse.ok ? await versionsResponse.json() : [];
    return { character, users, versions };
};
