<script lang="ts" module>
	export type ShopImplant = {
		id: number;
		name: string;
		description: string;
		cost: number;
	};
</script>

<script lang="ts">
	import type { VersionImplant } from '$lib/codex/managers/character-manager.svelte';
	import ImplantSlot from './implant-slot.svelte';

	let {
		catalog,
		selected = $bindable<VersionImplant[]>([]),
		remaining,
		discounts = new Map(),
		slotCount = 2
	}: {
		catalog: ShopImplant[];
		selected: VersionImplant[];
		remaining: number;
		discounts?: Map<number, number>;
		slotCount?: number;
	} = $props();

	function implantForSlot(slot: number): VersionImplant | null {
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
		next = [...next, { id: implant.id, name: implant.name, description: implant.description, slot }];
		selected = next;
	}

	function handleRemove(slot: number) {
		selected = selected.filter((i) => i.slot !== slot);
	}

	const slots = $derived(Array.from({ length: slotCount }, (_, i) => i + 1));
</script>

{#if catalog.length === 0}
	<p class="empty">no implants available</p>
{:else}
	<div class="slots">
		{#each slots as slot (slot)}
			<ImplantSlot
				slotNumber={slot}
				{catalog}
				selected={implantForSlot(slot)}
				{remaining}
				{discounts}
				onselect={(implant) => handleSelect(slot, implant)}
				onremove={() => handleRemove(slot)}
			/>
		{/each}
	</div>
{/if}

<style>
	.slots {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.empty {
		font-size: 1.0em;
		opacity: 0.4;
		font-style: italic;
	}
</style>
