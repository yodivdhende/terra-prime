import type { PageServerLoad } from './$types';
import type { CharacterVersionFull } from '$lib/managers/character-manager.svelte';

export const load: PageServerLoad = async ({ fetch }) => {
    const res = await fetch('/api/characters/versions');
    const list: { id: number; name: string; characterId: number; characterName: string }[] = res.ok
        ? await res.json()
        : [];

    const versions = await Promise.all(
        list.map(async (v) => {
            const fullRes = await fetch(`/api/characters/versions/${v.id}/full`);
            const full: CharacterVersionFull | null = fullRes.ok ? await fullRes.json() : null;
            return { ...v, full };
        })
    );

    return { versions };
};
