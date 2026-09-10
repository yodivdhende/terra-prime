import type { PageServerLoad } from './$types';
import type { CharacterVersionFull } from '$lib/managers/character-manager.svelte';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const [characterResponse, usersResponse, versionsResponse] = await Promise.all([
        fetch(`/api/characters/${params.id}`),
        fetch('/api/users'),
        fetch(`/api/characters/${params.id}/versions`)
    ]);
    const character = characterResponse.ok ? await characterResponse.json() : null;
    const users = usersResponse.ok ? await usersResponse.json() : [];
    const list: { id: number; name: string }[] = versionsResponse.ok ? await versionsResponse.json() : [];

    const versions = await Promise.all(
        list.map(async (v) => {
            const fullRes = await fetch(`/api/characters/versions/${v.id}/full`);
            const full: CharacterVersionFull | null = fullRes.ok ? await fullRes.json() : null;
            return { ...v, full };
        })
    );

    return { character, users, versions };
};
