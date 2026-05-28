<script lang="ts">
	import type { Character } from '$lib/db/character.repo';
	import type { EventCharacterBudget } from '$lib/db/event_budget.repo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let eventId: string = $state('');
	let participants: Character[] = $state([]);
	let budgetMap = $state<Map<number, number>>(new Map());

	$effect(() => {
		eventId = data.eventId;
		participants = data.participants ?? [];

		const map = new Map<number, number>();
		for (const p of participants) {
			if (p.id == null) continue;
			const existing = (data.budgets as EventCharacterBudget[]).find(
				(b) => b.characterId === p.id
			);
			map.set(p.id, existing?.budget ?? 0);
		}
		budgetMap = map;
	});

	async function saveBudget(characterId: number) {
		const budget = budgetMap.get(characterId) ?? 0;
		await fetch(`/api/events/${eventId}/budget/characters/${characterId}`, {
			method: 'post',
			body: JSON.stringify({ budget }),
			headers: { 'content-type': 'application/json' }
		});
	}
</script>

<main>
	<a href="..">back</a>
	<h2>Event Budget</h2>

	{#if participants.length === 0}
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
				{#each participants as participant}
					{#if participant.id != null}
						{@const cid = participant.id}
						<tr>
							<td>{participant.name}</td>
							<td class="owner">{participant.ownerName}</td>
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
	table {
		border-collapse: collapse;
	}
	th, td {
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
