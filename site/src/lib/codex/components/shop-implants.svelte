<script lang="ts" module>
	export type ShopImplant = {
		id: number;
		name: string;
		description: string;
		cost: number;
	};
</script>

<script lang="ts">
	import type { CharacterVersionImplant } from '$lib/db/character_version.repo';
	import Dropdown from '$lib/components/dropdown.svelte';
	import ImplantSearch from './implant-search.svelte';
	import { X } from '@lucide/svelte';

	let {
		catalog,
		selected = $bindable<CharacterVersionImplant[]>([]),
		remaining,
		discounts = new Map(),
		slotCount = 2
	}: {
		catalog: ShopImplant[];
		selected: CharacterVersionImplant[];
		remaining: number;
		discounts?: Map<number, number>;
		slotCount?: number;
	} = $props();

	function implantForSlot(slot: number): CharacterVersionImplant | null {
		return selected.find((i) => i.slot === slot) ?? null;
	}

	function effectiveCost(implant: ShopImplant) {
		return Math.max(0, implant.cost - (discounts.get(implant.id) ?? 0));
	}

	function handleSelect(slot: number, implant: ShopImplant) {
		const existing = selected.find((i) => i.slot === slot);
		let next = selected.filter((i) => i.slot !== slot);
		const refund = existing ? effectiveCost(catalog.find((c) => c.id === existing.id)!) : 0;
		const cost = effectiveCost(implant);
		if (cost > remaining + refund) return;
		next = [...next, { id: implant.id, slot }];
		selected = next;
	}

	function handleRemove(slot: number) {
		selected = selected.filter((i) => i.slot !== slot);
	}

	const slots = $derived(Array.from({ length: slotCount }, (_, i) => i + 1));
</script>

<main class="shop-implants">
	{#if catalog.length === 0}
		<p class="empty">no implants available</p>
	{:else}
		<div class="slots">
			{#each slots as slot (slot)}
				{@const current = implantForSlot(slot)}
				{@const currentEntry = current ? catalog.find((c) => c.id === current.id) : null}
				<div class="slot" class:filled={current != null}>
					<Dropdown open={selected.every(({ slot: islot }) => islot !== slot) ?? true}>
						{#snippet button()}
							<span class="slot-title">
								slot {slot}
								{#if currentEntry}
									<span class="slot-implant-name">— {currentEntry.name}</span>
								{/if}
							</span>
							{#if current}
								<button
									type="button"
									class="slot-remove"
									onclick={(e: MouseEvent) => {
										e.stopPropagation();
										handleRemove(slot);
									}}
									title="remove implant"
								>
									<X size={12} />
								</button>
							{/if}
						{/snippet}
						{#snippet content()}
							<ImplantSearch
								{catalog}
								{remaining}
								{discounts}
								{current}
								onselect={(implant) => handleSelect(slot, implant)}
							/>
						{/snippet}
					</Dropdown>
				</div>
			{/each}
		</div>
	{/if}
</main>

<style>
	.shop-implants {
		display: column;
		max-height: 100%;
	}

	.slots {
		display: flex;
		flex-direction: column;
		gap: 0;
		height: 100%;
	}

	.empty {
		font-size: 1em;
		opacity: 0.4;
		font-style: italic;
	}

	.slot {
		height: 100%;
		border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		margin-bottom: 0.3rem;
	}

	.slot.filled {
		border-color: var(--color-accent);
	}

	.slot-title {
		flex: 1;
		font-family: var(--font-mono);
		font-size: 0.95em;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-main);
		text-align: left;
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
</style>
