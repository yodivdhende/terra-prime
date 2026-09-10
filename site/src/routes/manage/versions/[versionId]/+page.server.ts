import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const versionRes = await fetch(`/api/characters/versions/${params.versionId}`);
  const bare = versionRes.ok ? await versionRes.json() : null;

  if (!bare) return { character: null, version: null, expertise: [], items: [], implants: [] };

  const characterId = bare.characterId;
  const [characterRes, fullVersionRes, expertiseRes, itemsRes, implantsRes] = await Promise.all([
    fetch(`/api/characters/${characterId}`),
    fetch(`/api/characters/${characterId}/versions/${params.versionId}`),
    fetch(`/api/expertise?characterId=${characterId}`),
    fetch(`/api/items?characterId=${characterId}`),
    fetch(`/api/implants?characterId=${characterId}`)
  ]);

  const character = characterRes.ok ? await characterRes.json() : null;
  const version = fullVersionRes.ok ? await fullVersionRes.json() : null;
  const expertise = expertiseRes.ok ? await expertiseRes.json() : [];
  const items = itemsRes.ok ? await itemsRes.json() : [];
  const implants = implantsRes.ok ? await implantsRes.json() : [];
  return { character, version, expertise, items, implants };
};
