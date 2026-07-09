<script lang="ts">
	import type { Character } from '$lib/db/character.repo';

	let {
		open = $bindable(false),
		excludeIds = [],
		characters = $bindable<Character[]>([]),
		onSelect
	}: {
		open?: boolean;
		excludeIds?: number[];
		characters?: Character[];
		onSelect: (character: Character) => void;
	} = $props();

	let searchQuery = $state('');

	$effect(() => {
		fetch('/api/characters').then(async (r) => {
			characters = await r.json();
		});
	});

	const excludeSet = $derived(new Set(excludeIds));

	const searchResults = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return characters.filter((c) => {
			if (c.id == null) return false;
			if (excludeSet.has(c.id)) return false;
			if (q.length === 0) return true;
			return c.name.toLowerCase().includes(q) || (c.ownerName ?? '').toLowerCase().includes(q);
		});
	});

	function select(character: Character) {
		onSelect(character);
		open = false;
		searchQuery = '';
	}
</script>

{#if open}
	<aside class="panel">
		<div class="panel-header">
			<h3>Add character</h3>
			<button onclick={() => (open = false)}>close</button>
		</div>
		<input type="text" placeholder="search by name or owner" bind:value={searchQuery} />
		<ul class="results">
			{#each searchResults as c (c.id)}
				{#if c.id != null}
					<li>
						<button onclick={() => select(c)}>
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
	.owner {
		font-weight: normal;
		opacity: 0.6;
	}
</style>
