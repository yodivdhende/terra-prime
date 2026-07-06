import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
    const [expertiseResponse, groupsResponse] = await Promise.all([
        fetch(`/api/expertise/${params.id}`),
        fetch('/api/expertise/groups')
    ]);
    const expertise = expertiseResponse.ok ? await expertiseResponse.json() : null;
    const groups = groupsResponse.ok ? await groupsResponse.json() : [];
    return { expertise, groups };
};
