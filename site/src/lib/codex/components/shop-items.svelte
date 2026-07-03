<script lang="ts" module>
	export type ShopItem = {
		id: number;
		name: string;
		description: string;
		cost: number;
		maxPerCharacter?: number | null;
	};
</script>

<script lang="ts">
	import type { VersionItem } from '$lib/codex/managers/character-manager.svelte';

	let {
		catalog,
		selected = $bindable<VersionItem[]>([]),
		remaining,
		discounts = new Map()
	}: {
		catalog: ShopItem[];
		selected: VersionItem[];
		remaining: number;
		discounts?: Map<number, number>;
	} = $props();

	let search = $state('');

	const filtered = $derived(
		search.trim()
			? catalog.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
			: catalog
	);

	function countOf(id: number) {
		return selected.find((i) => i.id === id)?.count ?? 0;
	}

	function effectiveCost(item: ShopItem) {
		return Math.max(0, item.cost - (discounts.get(item.id) ?? 0));
	}

	function add(item: ShopItem) {
		if (effectiveCost(item) > remaining) return;
		if (item.maxPerCharacter != null && countOf(item.id) >= item.maxPerCharacter) return;
		const existing = selected.find((i) => i.id === item.id);
		if (existing) {
			selected = selected.map((i) => (i.id === item.id ? { ...i, count: i.count + 1 } : i));
		} else {
			selected = [
				...selected,
				{ id: item.id, name: item.name, description: item.description, count: 1 }
			];
		}
	}

	function remove(item: ShopItem) {
		const existing = selected.find((i) => i.id === item.id);
		if (!existing) return;
		if (existing.count <= 1) {
			selected = selected.filter((i) => i.id !== item.id);
		} else {
			selected = selected.map((i) => (i.id === item.id ? { ...i, count: i.count - 1 } : i));
		}
	}
</script>

<div class="shop-items">
	{#if catalog.length > 0}
		<input class="search" type="text" placeholder="search…" bind:value={search} />
	{/if}

	{#if filtered.length === 0}
		<p class="empty">{catalog.length === 0 ? 'no items available' : 'no results'}</p>
	{:else}
		<ul class="catalog">
			{#each filtered as item (item.id)}
				{@const count = countOf(item.id)}
				{@const owned = count > 0}
				{@const discount = discounts.get(item.id) ?? 0}
				{@const effective = Math.max(0, item.cost - discount)}
				{@const discounted = discount > 0 && item.cost > 0}
				{@const blocked = effective > remaining || (item.maxPerCharacter != null && count >= item.maxPerCharacter)}
				<li class="entry" class:owned class:discounted>
					<div class="entry-info">
						<span class="entry-name">
							{item.name}
							{#if discounted}
								<span class="discount-badge" title="company discount: -{discount}">deal</span>
							{/if}
						</span>
						{#if item.description}
							<span class="entry-desc">{item.description}</span>
						{/if}
					</div>
					<span class="entry-cost">
						{#if discounted}
							<span class="cost-old">{item.cost}</span>
						{/if}
						<span class="cost-new" class:free={discounted && effective === 0}>{effective}</span>
					</span>
					<div class="entry-controls">
						{#if owned}
							<button type="button" class="ctrl dec" onclick={() => remove(item)}>−</button>
							<span class="count">{count}</span>
						{/if}
						<button
							type="button"
							class="ctrl inc"
							class:buy={!owned}
							disabled={blocked}
							onclick={() => add(item)}
						>
							{owned ? '+' : 'buy'}
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.shop-items {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.search {
		width: 100%;
		box-sizing: border-box;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 1.0em;
		padding: 0.35rem 0.6rem;
		outline: none;
		transition: border-color 0.15s;
	}

	.search::placeholder {
		opacity: 0.35;
	}

	.search:focus {
		border-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
	}

	.catalog {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.entry {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.4rem 0.6rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		transition: border-color 0.15s, background 0.15s;
	}

	.entry.owned {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	.entry.discounted {
		border-color: color-mix(in srgb, #4caf82 45%, transparent);
	}

	.entry.discounted.owned {
		border-color: #4caf82;
		background: color-mix(in srgb, #4caf82 8%, transparent);
	}

	.discount-badge {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.05rem 0.35rem;
		font-size: 0.7em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #4caf82;
		border: 1px solid color-mix(in srgb, #4caf82 60%, transparent);
		vertical-align: middle;
	}

	.cost-old {
		text-decoration: line-through;
		opacity: 0.4;
		margin-right: 0.35rem;
		font-size: 0.9em;
	}

	.cost-new.free {
		color: #4caf82;
		font-weight: bold;
	}

	.entry-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.entry-name {
		font-size: 1.05em;
		letter-spacing: 0.03em;
	}

	.entry-desc {
		font-size: 0.95em;
		opacity: 0.5;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.entry-cost {
		font-size: 1.05em;
		color: var(--color-accent);
		opacity: 0.7;
		min-width: 2ch;
		text-align: right;
	}

	.entry-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.count {
		font-size: 1.0em;
		min-width: 1.5ch;
		text-align: center;
		color: var(--color-accent);
	}

	.ctrl {
		font-family: var(--font-mono);
		font-size: 1.05em;
		line-height: 1;
		padding: 0.2rem 0.45rem;
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}

	.ctrl:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.ctrl.buy {
		font-size: 0.95em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.25rem 0.6rem;
	}

	.ctrl.dec {
		border-color: color-mix(in srgb, #d95c5c 60%, transparent);
		color: #d95c5c;
	}

	.ctrl.dec:hover {
		border-color: #d95c5c;
	}

	.ctrl:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	.empty {
		font-size: 1.0em;
		opacity: 0.4;
		font-style: italic;
	}
</style>
