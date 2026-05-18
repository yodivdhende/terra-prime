import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const [characterRes, versionRes, skillsRes, itemsRes, implantsRes] = await Promise.all([
        fetch(`/api/characters/${params.id}`),
        fetch(`/api/characters/${params.id}/versions/${params.versionId}`),
        fetch('/api/skills'),
        fetch('/api/items'),
        fetch('/api/implants')
    ]);
    const character = characterRes.ok ? await characterRes.json() : null;
    const version = versionRes.ok ? await versionRes.json() : null;
    const skills = skillsRes.ok ? await skillsRes.json() : [];
    const items = itemsRes.ok ? await itemsRes.json() : [];
    const implants = implantsRes.ok ? await implantsRes.json() : [];
    return { character, version, skills, items, implants };
};
