import { SvelteMap } from 'svelte/reactivity';
import type { Expertise } from '$lib/db/expertise.repo';

export type ExpertiseGroupAverage = {
	id: number;
	name: string;
	average: number;
	icon: string | null;
	color: string | null;
};

type ExpertiseEntry = {
	id: number;
	name: string;
	group: number;
	groupName: string;
	value: number;
	icon: string | null;
	groupIcon: string | null;
	groupColor: string | null;
};

export function createExpertiseManager() {
  let expertise = $state<ExpertiseEntry[]>([]);
  let pendingValues = new SvelteMap<number, number>();

  const groups: ExpertiseGroupAverage[] = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local scratch, discarded when the derivation returns
    const map = new Map<
      number,
      { name: string; total: number; count: number; icon: string | null; color: string | null }
    >();
    for (const e of expertise) {
      if (!map.has(e.group))
        map.set(e.group, {
          name: e.groupName,
          total: 0,
          count: 0,
          icon: e.groupIcon,
          color: e.groupColor
        });
      const g = map.get(e.group)!;
      g.total += e.value;
      g.count += 1;
    }
    return Array.from(map.entries())
      .map(([id, { name, total, count, icon, color }]) => {
        const average = count > 0 ? total / count : 0;
        return { id: Number(id), name, average, icon, color };
      });
  });

  const selected: ExpertiseEntry[] = $derived(expertise.filter((e) => e.value > 0));

  function setCatalog(catalog: Expertise[]) {
    expertise = catalog.flatMap((e) => {
      if (e.id == null) return [];
      return [
        {
          id: e.id,
          name: e.name,
          group: e.groupId,
          groupName: e.groupName,
          value: pendingValues.get(e.id) ?? 0,
          icon: e.icon ?? null,
          groupIcon: e.groupIcon ?? null,
          groupColor: e.groupColor ?? null
        }
      ];
    });
  }

  function setValues(characterExpertise: { id: number; name: string; group: number; groupName: string; value: number }[]) {
    pendingValues = new SvelteMap(characterExpertise.map((e) => [e.id, e.value]));
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
