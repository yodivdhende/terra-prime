<script lang="ts">
	import type { Character } from '$lib/db/character.repo';
	import SearchSelect from '$lib/components/search-select.svelte';

	let {
		members = $bindable<number[]>(),
		charactersEndpoint = '/api/characters'
	}: {
		members: number[];
		charactersEndpoint?: string;
	} = $props();

	let characters = $state<Character[]>([]);
	let memberQuery = $state('');

	let memberOptions = $derived(
		characters
			.filter((c) => !members.includes(c.id))
			.map((c) => ({ label: `${c.name} (${c.ownerName})`, value: String(c.id) }))
	);

	$effect(() => {
		fetch(charactersEndpoint)
			.then((r) => r.json())
			.then((data: Character[]) => {
				if (Array.isArray(data)) characters = data;
			});
	});

	function addMember(id: number) {
		if (!members.includes(id)) members = [...members, id];
		memberQuery = '';
	}

	function removeMember(id: number) {
		members = members.filter((m) => m !== id);
	}
</script>

<div class="member-select">
	{#if members.length > 0}
		<div class="member-tags">
			{#each members as memberId (memberId)}
				{@const char = characters.find((c) => c.id === memberId)}
				<span class="tag">
					{char?.name ?? memberId}
					<button type="button" onclick={() => removeMember(memberId)}>×</button>
				</span>
			{/each}
		</div>
	{/if}
	<SearchSelect
		options={memberOptions}
		bind:value={memberQuery}
		placeholder="Search character..."
		onselect={(o) => addMember(Number(o.value))}
	/>
</div>

<style>
	.member-select {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.member-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.tag {
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border);
		padding: 2px 6px;
		font-size: 0.85em;
		color: var(--color-main-dim);
	}

	.tag button {
		background: none;
		border: none;
		color: var(--color-main-dim);
		cursor: pointer;
		padding: 0;
		font-size: 1em;
		line-height: 1;
	}

	.tag button:hover {
		color: var(--color-accent);
	}
</style>
