import type { Skill } from '$lib/db/skills.repo';

export type SkillGroupAverage = { id: number; name: string; average: number };

type SkillEntry = { id: number; name: string; group: number; groupName: string; value: number };

export function createSkillManager() {
  let skills = $state<SkillEntry[]>([]);
  let pendingValues = new Map<number, number>();

  const groups: SkillGroupAverage[] = $derived.by(() => {
    const map = new Map<number, { name: string; total: number; count: number }>();
    for (const s of skills) {
      if (!map.has(s.group)) map.set(s.group, { name: s.groupName, total: 0, count: 0 });
      const g = map.get(s.group)!;
      g.total += s.value;
      g.count += 1;
    }
    return Array.from(map.entries()).map(([id, { name, total, count }]) => ({
      id: Number(id),
      name,
      average: count > 0 ? total / count : 0
    }));
  });

  const selected: SkillEntry[] = $derived(skills.filter((s) => s.value > 0));

  function setCatalog(catalog: Skill[]) {
    skills = catalog.flatMap((s) => {
      if (s.id == null) return [];
      return [{ id: s.id, name: s.name, group: s.groupId, groupName: s.groupName, value: pendingValues.get(s.id) ?? 0 }];
    });
  }

  function setValues(characterSkills: { id: number; name: string; group: number; groupName: string; value: number }[]) {
    pendingValues = new Map(characterSkills.map((s) => [s.id, s.value]));
    for (let i = 0; i < skills.length; i++) {
      skills[i].value = pendingValues.get(skills[i].id) ?? 0;
    }
  }

  function setValue(id: number, value: number) {
    if (value <= 0) pendingValues.delete(id); else pendingValues.set(id, value);
    const idx = skills.findIndex((s) => s.id === id);
    if (idx >= 0) skills[idx].value = value;
  }

  function reset() {
    pendingValues.clear();
    for (let i = 0; i < skills.length; i++) skills[i].value = 0;
  }

  return {
    get skills() { return skills; },
    get groups() { return groups; },
    get selected() { return selected; },
    setCatalog, setValues, setValue, reset,
  };
}

export type SkillManager = ReturnType<typeof createSkillManager>;
