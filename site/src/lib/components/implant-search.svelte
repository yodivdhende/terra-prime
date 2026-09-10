<script lang="ts">
	import type { ShopImplant } from './shop-implants.svelte';
	import { applyDiscount } from '$lib/utils/discount';

	let {
		catalog,
		remaining,
		discounts = new Map(),
		current = null,
		onselect
	}: {
		catalog: ShopImplant[];
		remaining: number;
		discounts?: Map<number, number>;
		current: { id: number } | null;
		onselect: (implant: ShopImplant) => void;
	} = $props();

	let search = $state('');

	const filtered = $derived(
		search.trim().length > 0
			? catalog.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
			: catalog
	);
</script>

<input type="text" class="slot-search" placeholder="search implants…" bind:value={search} />
<ul class="slot-list">
	{#each filtered as implant (implant.id)}
		{@const discount = discounts.get(implant.id) ?? 0}
		{@const effective = applyDiscount(implant.cost, discount)}
		{@const discounted = discount > 0 && implant.cost > 0}
		{@const blocked = effective > remaining && !(current?.id === implant.id)}
		<li class="slot-entry" class:discounted>
			<div class="entry-info">
				<span class="entry-name">
					{implant.name}
					{#if discounted}
						<span class="discount-badge" title="company discount: -{discount}%">deal</span>
					{/if}
				</span>
				{#if implant.description}
					<span class="entry-desc">{implant.description}</span>
				{/if}
			</div>
			<span class="entry-cost">
				{#if discounted}
					<span class="cost-old">{implant.cost}</span>
				{/if}
				<span class="cost-new" class:free={discounted && effective === 0}>{effective}</span>
			</span>
			<button
				type="button"
				class="entry-select"
				disabled={blocked}
				onclick={() => onselect(implant)}
			>
				select
			</button>
		</li>
	{/each}
</ul>

<style>
	.slot-search {
		width: 100%;
		padding: 0.35rem 0.5rem;
		margin-bottom: 0.4rem;
		background: transparent;
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.9em;
		box-sizing: border-box;
	}

	.slot-search::placeholder {
		opacity: 0.3;
	}

	.slot-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		overflow-y: auto;
	}

	.slot-entry {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 0.5rem;
		padding: 0.3rem 0.4rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 10%, transparent);
	}

	.slot-entry.discounted {
		border-color: color-mix(in srgb, #4caf82 30%, transparent);
	}

	.entry-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.entry-name {
		font-size: 0.95em;
	}

	.entry-desc {
		font-size: 0.85em;
		opacity: 0.4;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.discount-badge {
		display: inline-block;
		margin-left: 0.3rem;
		padding: 0.02rem 0.3rem;
		font-size: 0.7em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #4caf82;
		border: 1px solid color-mix(in srgb, #4caf82 60%, transparent);
		vertical-align: middle;
	}

	.entry-cost {
		font-size: 0.95em;
		color: var(--color-accent);
		opacity: 0.7;
		min-width: 2ch;
		text-align: right;
	}

	.cost-old {
		text-decoration: line-through;
		opacity: 0.4;
		margin-right: 0.25rem;
		font-size: 0.9em;
	}

	.cost-new.free {
		color: #4caf82;
		font-weight: bold;
	}

	.entry-select {
		font-family: var(--font-mono);
		font-size: 0.85em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.2rem 0.5rem;
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		cursor: pointer;
	}

	.entry-select:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.entry-select:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}
</style>
