import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
  const versionRes = await fetch(`/api/characters/versions/${params.versionId}`);
  const bare = versionRes.ok ? await versionRes.json() : null;

  if (!bare) return { character: null, version: null, skills: [], items: [], implants: [] };

  const [characterRes, fullVersionRes, skillsRes, itemsRes, implantsRes] = await Promise.all([
    fetch(`/api/characters/${bare.characterId}`),
    fetch(`/api/characters/${bare.characterId}/versions/${params.versionId}`),
    fetch('/api/skills'),
    fetch('/api/items'),
    fetch('/api/implants')
  ]);

  const character = characterRes.ok ? await characterRes.json() : null;
  const version = fullVersionRes.ok ? await fullVersionRes.json() : null;
  const skills = skillsRes.ok ? await skillsRes.json() : [];
  const items = itemsRes.ok ? await itemsRes.json() : [];
  const implants = implantsRes.ok ? await implantsRes.json() : [];
  return { character, version, skills, items, implants };
};
