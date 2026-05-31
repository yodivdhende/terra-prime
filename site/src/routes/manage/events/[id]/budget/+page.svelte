<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SearchSelect from '$lib/components/search-select.svelte';
	import type { Character } from '$lib/db/character.repo';
	import type { EventCharacterBudget } from '$lib/db/event_budget.repo';
	import { CirclePlus } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	const allCharacters = $derived<Character[]>(data.allCharacters ?? []);
	const charById = $derived(new Map(allCharacters.map((c) => [c.id!, c])));

	const rows = $derived.by<Character[]>(() => {
		const seen = new Set<number>();
		const out: Character[] = [];
		for (const p of (data.participants as Character[]) ?? []) {
			if (p.id != null && !seen.has(p.id)) {
				seen.add(p.id);
				out.push(p);
			}
		}
		for (const b of (data.budgets as EventCharacterBudget[]) ?? []) {
			if (!seen.has(b.characterId)) {
				const c = charById.get(b.characterId);
				if (c) {
					seen.add(b.characterId);
					out.push(c);
				}
			}
		}
		return out;
	});

	let budgetMap = $state<Map<number, number>>(new Map());

	$effect(() => {
		const map = new Map<number, number>();
		for (const r of rows) {
			if (r.id == null) continue;
			const existing = (data.budgets as EventCharacterBudget[]).find((b) => b.characterId === r.id);
			map.set(r.id, existing?.budget ?? 0);
		}
		budgetMap = map;
	});

	type Draft = { key: number; characterId: number | null; budget: number };
	let drafts = $state<Draft[]>([]);
	let nextKey = 0;

	function addDraft() {
		drafts = [...drafts, { key: nextKey++, characterId: null, budget: 0 }];
	}

	function removeDraft(key: number) {
		drafts = drafts.filter((d) => d.key !== key);
	}

	function optionsFor(draft: Draft) {
		const usedIds = new Set<number>([
			...rows.map((r) => r.id!).filter((id) => id != null),
			...drafts
				.filter((d) => d.key !== draft.key && d.characterId != null)
				.map((d) => d.characterId!)
		]);
		return allCharacters
			.filter((c) => c.id != null && !usedIds.has(c.id))
			.map((c) => ({ label: `${c.name} (${c.ownerName})`, value: String(c.id) }));
	}

	async function saveBudget(characterId: number) {
		const budget = budgetMap.get(characterId) ?? 0;
		try {
			await fetch(`/api/events/${data.eventId}/budget/characters/${characterId}`, {
				method: 'post',
				body: JSON.stringify({ budget }),
				headers: { 'content-type': 'application/json' }
			});
			TOAST_MANAGER.success('Budget saved');
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}

	async function saveDraft(draft: Draft) {
		if (draft.characterId == null) return;
		try {
			await fetch(`/api/events/${data.eventId}/budget/characters/${draft.characterId}`, {
				method: 'post',
				body: JSON.stringify({ budget: draft.budget }),
				headers: { 'content-type': 'application/json' }
			});
			TOAST_MANAGER.success('Budget saved');
			removeDraft(draft.key);
			await invalidateAll();
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href="..">back</a>
	<h2>Event Budget</h2>

	<button class="add" onclick={addDraft} aria-label="Add character budget">
		<CirclePlus />
	</button>

	{#if rows.length === 0 && drafts.length === 0}
		<p>No participants registered for this event.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Character</th>
					<th>Owner</th>
					<th>Budget</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each drafts as draft (draft.key)}
					<tr>
						<td colspan="2">
							<SearchSelect
								options={optionsFor(draft)}
								placeholder="Search character..."
								onselect={(o) => (draft.characterId = Number(o.value))}
							/>
						</td>
						<td>
							<input
								type="number"
								min="0"
								bind:value={draft.budget}
								disabled={draft.characterId == null}
							/>
						</td>
						<td>
							<button onclick={() => saveDraft(draft)} disabled={draft.characterId == null}>
								save
							</button>
							<button onclick={() => removeDraft(draft.key)}>cancel</button>
						</td>
					</tr>
				{/each}
				{#each rows as row}
					{#if row.id != null}
						{@const cid = row.id}
						<tr>
							<td>{row.name}</td>
							<td class="owner">{row.ownerName}</td>
							<td>
								<input
									type="number"
									min="0"
									value={budgetMap.get(cid) ?? 0}
									oninput={(e) => {
										budgetMap.set(cid, Number((e.target as HTMLInputElement).value));
										budgetMap = new Map(budgetMap);
									}}
								/>
							</td>
							<td><button onclick={() => saveBudget(cid)}>save</button></td>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 16px;
		gap: 12px;
	}
	.add {
		align-self: flex-start;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-accent);
	}
	table {
		border-collapse: collapse;
	}
	th,
	td {
		padding: 6px 10px;
		border-bottom: 1px solid silver;
		text-align: left;
	}
	.owner {
		opacity: 0.6;
	}
	input[type='number'] {
		width: 90px;
	}
</style>
