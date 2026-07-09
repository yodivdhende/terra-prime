<script lang="ts">
	import type { ShopImplant } from './shop-implants.svelte';
	import type { VersionImplant } from '$lib/managers/character-manager.svelte';
	import { ChevronDown, ChevronRight, X } from '@lucide/svelte';

	let {
		slotNumber,
		catalog,
		selected = null,
		remaining,
		discounts = new Map(),
		onselect,
		onremove
	}: {
		slotNumber: number;
		catalog: ShopImplant[];
		selected: VersionImplant | null;
		remaining: number;
		discounts?: Map<number, number>;
		onselect: (implant: ShopImplant) => void;
		onremove: () => void;
	} = $props();

	let expanded = $state(false);
	let search = $state('');

	const filtered = $derived(
		search.trim().length > 0
			? catalog.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
			: catalog
	);

</script>

<div class="slot" class:filled={selected != null}>
	<div class="slot-header">
		<button type="button" class="slot-toggle" onclick={() => (expanded = !expanded)}>
			<span class="slot-chevron">
				{#if expanded}
					<ChevronDown size={14} />
				{:else}
					<ChevronRight size={14} />
				{/if}
			</span>
			<span class="slot-title">
				slot {slotNumber}
				{#if selected}
					<span class="slot-implant-name">— {selected.name}</span>
				{/if}
			</span>
		</button>
		{#if selected}
			<button
				type="button"
				class="slot-remove"
				onclick={() => onremove()}
				title="remove implant"
			>
				<X size={12} />
			</button>
		{/if}
	</div>

	{#if expanded}
		<div class="slot-body">
			<input
				type="text"
				class="slot-search"
				placeholder="search implants…"
				bind:value={search}
			/>
			<ul class="slot-list">
				{#each filtered as implant (implant.id)}
					{@const discount = discounts.get(implant.id) ?? 0}
					{@const effective = Math.max(0, implant.cost - discount)}
					{@const discounted = discount > 0 && implant.cost > 0}
					{@const blocked = effective > remaining && !(selected?.id === implant.id)}
					<li class="slot-entry" class:discounted>
						<div class="entry-info">
							<span class="entry-name">
								{implant.name}
								{#if discounted}
									<span class="discount-badge">deal</span>
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
		</div>
	{/if}
</div>

<style>
	.slot {
		border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		margin-bottom: 0.3rem;
	}

	.slot.filled {
		border-color: var(--color-accent);
	}

	.slot-header {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.6rem;
		background: transparent;
	}

	.slot.filled .slot-header {
		background: color-mix(in srgb, var(--color-accent) 8%, transparent);
	}

	.slot-toggle {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.95em;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-main);
		text-align: left;
	}

	.slot-chevron {
		display: flex;
		opacity: 0.5;
	}

	.slot-title {
		flex: 1;
	}

	.slot-implant-name {
		text-transform: none;
		letter-spacing: 0;
		opacity: 0.7;
	}

	.slot-remove {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.2rem;
		background: transparent;
		border: 1px solid color-mix(in srgb, #d95c5c 60%, transparent);
		color: #d95c5c;
		cursor: pointer;
	}

	.slot-remove:hover {
		background: color-mix(in srgb, #d95c5c 15%, transparent);
	}

	.slot-body {
		padding: 0.4rem 0.6rem 0.6rem;
		border-top: 1px solid color-mix(in srgb, var(--color-accent) 10%, transparent);
	}

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
		max-height: 200px;
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
