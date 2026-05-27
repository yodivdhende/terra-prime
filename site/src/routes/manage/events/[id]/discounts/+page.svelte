<script lang="ts">
	import type { Character } from '$lib/db/character.repo';
	import type { CharacterDiscounts } from '$lib/db/event_discounts.repo';
	import type { Item } from '$lib/db/items.repo';
	import type { Implant } from '$lib/db/implants.repo';
	import type { Skill } from '$lib/db/skills.repo';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let eventId: string = $state('');
	let characters: Character[] = $state([]);
	let discountMap = $state<Map<number, CharacterDiscounts>>(new Map());
	let items: Item[] = $state([]);
	let implants: Implant[] = $state([]);
	let skills: Skill[] = $state([]);

	let panelOpen = $state(false);
	let searchQuery = $state('');

	$effect(() => {
		eventId = data.eventId;
		characters = data.characters ?? [];
		items = data.items ?? [];
		implants = data.implants ?? [];
		skills = data.skills ?? [];

		const map = new Map<number, CharacterDiscounts>();
		for (const d of (data.discounts as CharacterDiscounts[]) ?? []) {
			map.set(d.characterId, structuredClone(d));
		}
		discountMap = map;
	});

	const charactersById = $derived(new Map(characters.filter((c) => c.id != null).map((c) => [c.id as number, c])));

	const displayedCharacters = $derived.by(() => {
		const result: Character[] = [];
		for (const id of discountMap.keys()) {
			const c = charactersById.get(id);
			if (c != null) result.push(c);
		}
		return result;
	});

	const searchResults = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return characters.filter((c) => {
			if (c.id == null) return false;
			if (discountMap.has(c.id)) return false;
			if (q.length === 0) return true;
			return (
				c.name.toLowerCase().includes(q) ||
				(c.ownerName ?? '').toLowerCase().includes(q)
			);
		});
	});

	function addCharacter(characterId: number) {
		if (discountMap.has(characterId)) return;
		discountMap.set(characterId, { characterId, items: [], implants: [], skills: [] });
		discountMap = new Map(discountMap);
		panelOpen = false;
		searchQuery = '';
	}

	function getDiscounts(characterId: number): CharacterDiscounts {
		return discountMap.get(characterId) ?? { characterId, items: [], implants: [], skills: [] };
	}

	function addItemDiscount(characterId: number) {
		const d = getDiscounts(characterId);
		d.items = [...d.items, { itemId: items[0]?.id ?? 0, discount: 0 }];
		discountMap.set(characterId, d);
		discountMap = new Map(discountMap);
	}
	function removeItemDiscount(characterId: number, index: number) {
		const d = getDiscounts(characterId);
		d.items = d.items.filter((_, i) => i !== index);
		discountMap.set(characterId, d);
		discountMap = new Map(discountMap);
	}

	function addImplantDiscount(characterId: number) {
		const d = getDiscounts(characterId);
		d.implants = [...d.implants, { implantId: implants[0]?.id ?? 0, discount: 0 }];
		discountMap.set(characterId, d);
		discountMap = new Map(discountMap);
	}
	function removeImplantDiscount(characterId: number, index: number) {
		const d = getDiscounts(characterId);
		d.implants = d.implants.filter((_, i) => i !== index);
		discountMap.set(characterId, d);
		discountMap = new Map(discountMap);
	}

	function addSkillDiscount(characterId: number) {
		const d = getDiscounts(characterId);
		d.skills = [...d.skills, { skillId: skills[0]?.id ?? 0, discount: 0 }];
		discountMap.set(characterId, d);
		discountMap = new Map(discountMap);
	}
	function removeSkillDiscount(characterId: number, index: number) {
		const d = getDiscounts(characterId);
		d.skills = d.skills.filter((_, i) => i !== index);
		discountMap.set(characterId, d);
		discountMap = new Map(discountMap);
	}

	async function saveDiscounts(characterId: number) {
		const d = getDiscounts(characterId);
		await fetch(`/api/events/${eventId}/discounts/characters/${characterId}`, {
			method: 'post',
			body: JSON.stringify({ items: d.items, implants: d.implants, skills: d.skills }),
			headers: { 'content-type': 'application/json' }
		});
	}
</script>

<main>
	<a href="..">back</a>
	<div class="header">
		<h2>Event Discounts</h2>
		<button onclick={() => (panelOpen = true)}>+ add character</button>
	</div>

	{#each displayedCharacters as character}
		{#if character.id != null}
			{@const d = getDiscounts(character.id)}
			{@const cid = character.id}
			<details>
				<summary>{character.name} <span class="owner">({character.ownerName})</span></summary>

				<div class="character-discounts">
					<h4>Items</h4>
					<table>
						<thead><tr><th>Item</th><th>Discount</th><th></th></tr></thead>
						<tbody>
							{#each d.items as row, i}
								<tr>
									<td>
										<select bind:value={row.itemId}>
											{#each items as item}
												<option value={item.id}>{item.name}</option>
											{/each}
										</select>
									</td>
									<td><input type="number" bind:value={row.discount} min="0" /></td>
									<td><button onclick={() => removeItemDiscount(cid, i)}>remove</button></td>
								</tr>
							{/each}
						</tbody>
					</table>
					<button onclick={() => addItemDiscount(cid)}>+ add item discount</button>

					<h4>Implants</h4>
					<table>
						<thead><tr><th>Implant</th><th>Discount</th><th></th></tr></thead>
						<tbody>
							{#each d.implants as row, i}
								<tr>
									<td>
										<select bind:value={row.implantId}>
											{#each implants as implant}
												<option value={implant.id}>{implant.name}</option>
											{/each}
										</select>
									</td>
									<td><input type="number" bind:value={row.discount} min="0" /></td>
									<td><button onclick={() => removeImplantDiscount(cid, i)}>remove</button></td>
								</tr>
							{/each}
						</tbody>
					</table>
					<button onclick={() => addImplantDiscount(cid)}>+ add implant discount</button>

					<h4>Skills</h4>
					<table>
						<thead><tr><th>Skill</th><th>Discount</th><th></th></tr></thead>
						<tbody>
							{#each d.skills as row, i}
								<tr>
									<td>
										<select bind:value={row.skillId}>
											{#each skills as skill}
												<option value={skill.id}>{skill.name}</option>
											{/each}
										</select>
									</td>
									<td><input type="number" bind:value={row.discount} min="0" /></td>
									<td><button onclick={() => removeSkillDiscount(cid, i)}>remove</button></td>
								</tr>
							{/each}
						</tbody>
					</table>
					<button onclick={() => addSkillDiscount(cid)}>+ add skill discount</button>

					<div class="actions">
						<button onclick={() => saveDiscounts(cid)}>save discounts</button>
					</div>
				</div>
			</details>
		{/if}
	{/each}

	{#if displayedCharacters.length === 0}
		<p>No characters with discounts yet. Click "+ add character" to add one.</p>
	{/if}
</main>

{#if panelOpen}
	<aside class="panel">
		<div class="panel-header">
			<h3>Add character</h3>
			<button onclick={() => (panelOpen = false)}>close</button>
		</div>
		<input
			type="text"
			placeholder="search by name or owner"
			bind:value={searchQuery}
		/>
		<ul class="results">
			{#each searchResults as c}
				{#if c.id != null}
					{@const cid = c.id}
					<li>
						<button onclick={() => addCharacter(cid)}>
							{c.name} <span class="owner">({c.ownerName})</span>
						</button>
					</li>
				{/if}
			{/each}
			{#if searchResults.length === 0}
				<li class="empty">no matches</li>
			{/if}
		</ul>
	</aside>
{/if}

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 16px;
		gap: 12px;
	}
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	details {
		border: 1px solid silver;
		border-radius: 4px;
		padding: 8px;
	}
	summary {
		cursor: pointer;
		font-weight: bold;
	}
	.owner {
		font-weight: normal;
		opacity: 0.6;
	}
	.character-discounts {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 8px;
	}
	table {
		border-collapse: collapse;
	}
	th, td {
		padding: 6px 8px;
		border-bottom: 1px solid silver;
	}
	.actions {
		margin-top: 8px;
	}
	input[type='number'] {
		width: 80px;
	}
	.panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 360px;
		color: var(--color-main);
		background: var(--color-bg);
		border-left: 1px solid var(--color-main);
		box-shadow: -2px 0 8px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		z-index: 100;
	}
	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.panel input[type='text'] {
		padding: 6px 8px;
		color: var(--color-main);
		background: var(--color-bg);
		border: 1px solid var(--color-main);
	}
	.results {
		list-style: none;
		padding: 0;
		margin: 0;
		overflow-y: auto;
		flex: 1;
	}
	.results li button {
		display: block;
		width: 100%;
		text-align: left;
		padding: 6px 8px;
		color: var(--color-main);
		background: transparent;
		border: none;
		cursor: pointer;
	}
	.results li button:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.results li.empty {
		padding: 6px 8px;
		color: var(--color-main-dim);
	}
</style>
