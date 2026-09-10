import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const [expertiseResponse, groupsResponse, charactersResponse] = await Promise.all([
        fetch(`/api/expertise/${params.id}`),
        fetch('/api/expertise/groups'),
        fetch('/api/characters')
    ]);
    const expertise = expertiseResponse.ok ? await expertiseResponse.json() : null;
    const groups = groupsResponse.ok ? await groupsResponse.json() : [];
    const characters = charactersResponse.ok ? await charactersResponse.json() : [];
    return { expertise, groups, characters };
};
