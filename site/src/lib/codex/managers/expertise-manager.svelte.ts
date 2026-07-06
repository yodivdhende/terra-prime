import type { Expertise } from '$lib/db/expertise.repo';

export type ExpertiseGroupAverage = { id: number; name: string; average: number };

type ExpertiseEntry = { id: number; name: string; group: number; groupName: string; value: number };

export function createExpertiseManager() {
  let expertise = $state<ExpertiseEntry[]>([]);
  let pendingValues = new Map<number, number>();

  const groups: ExpertiseGroupAverage[] = $derived.by(() => {
    const map = new Map<number, { name: string; total: number; count: number }>();
    for (const e of expertise) {
      if (!map.has(e.group)) map.set(e.group, { name: e.groupName, total: 0, count: 0 });
      const g = map.get(e.group)!;
      g.total += e.value;
      g.count += 1;
    }
    return Array.from(map.entries())
      .map(([id, { name, total, count }]) => {
        const average = count > 0 ? total / count : 0;
        console.log({ name, average, count, total });
        return { id: Number(id), name, average };
      });
  });

  const selected: ExpertiseEntry[] = $derived(expertise.filter((e) => e.value > 0));

  function setCatalog(catalog: Expertise[]) {
    expertise = catalog.flatMap((e) => {
      if (e.id == null) return [];
      return [{ id: e.id, name: e.name, group: e.groupId, groupName: e.groupName, value: pendingValues.get(e.id) ?? 0 }];
    });
  }

  function setValues(characterExpertise: { id: number; name: string; group: number; groupName: string; value: number }[]) {
    pendingValues = new Map(characterExpertise.map((e) => [e.id, e.value]));
    for (let i = 0; i < expertise.length; i++) {
      expertise[i].value = pendingValues.get(expertise[i].id) ?? 0;
    }
  }

  function setValue(id: number, value: number) {
    if (value <= 0) pendingValues.delete(id); else pendingValues.set(id, value);
    const idx = expertise.findIndex((e) => e.id === id);
    if (idx >= 0) expertise[idx].value = value;
  }

  function reset() {
    pendingValues.clear();
    for (let i = 0; i < expertise.length; i++) expertise[i].value = 0;
  }

  return {
    get expertise() { return expertise; },
    get groups() { return groups; },
    get selected() { return selected; },
    setCatalog, setValues, setValue, reset,
  };
}

export type ExpertiseManager = ReturnType<typeof createExpertiseManager>;
