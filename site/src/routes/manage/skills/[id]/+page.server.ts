import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const [skillResponse, groupsResponse] = await Promise.all([
        fetch(`/api/skills/${params.id}`),
        fetch('/api/skills/groups')
    ]);
    const skill = skillResponse.ok ? await skillResponse.json() : null;
    const groups = groupsResponse.ok ? await groupsResponse.json() : [];
    return { skill, groups };
};
