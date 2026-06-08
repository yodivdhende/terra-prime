<script lang="ts" module>
	export type ShopImplant = {
		id: number;
		name: string;
		description: string;
		cost: number;
		prerequisite?: number | null;
	};
</script>

<script lang="ts">
	import type { VersionImplant } from '$lib/codex/managers/character-manager.svelte';

	let {
		catalog,
		selected = $bindable<VersionImplant[]>([]),
		remaining,
		discounts = new Map()
	}: {
		catalog: ShopImplant[];
		selected: VersionImplant[];
		remaining: number;
		discounts?: Map<number, number>;
	} = $props();

	function has(id: number) {
		return selected.some((i) => i.id === id);
	}

	function effectiveCost(implant: ShopImplant) {
		return Math.max(0, implant.cost - (discounts.get(implant.id) ?? 0));
	}

	function prerequisiteMissing(implant: ShopImplant) {
		return implant.prerequisite != null && !has(implant.prerequisite);
	}

	function isPrerequisiteFor(implant: ShopImplant) {
		return selected.some((s) => {
			const catalogEntry = catalog.find((c) => c.id === s.id);
			return catalogEntry?.prerequisite === implant.id;
		});
	}

	function prerequisiteName(implant: ShopImplant) {
		if (implant.prerequisite == null) return null;
		return catalog.find((c) => c.id === implant.prerequisite)?.name ?? null;
	}

	function toggle(implant: ShopImplant) {
		if (has(implant.id)) {
			if (isPrerequisiteFor(implant)) return;
			selected = selected.filter((i) => i.id !== implant.id);
		} else {
			if (effectiveCost(implant) > remaining) return;
			if (prerequisiteMissing(implant)) return;
			selected = [
				...selected,
				{ id: implant.id, name: implant.name, description: implant.description }
			];
		}
	}
</script>

{#if catalog.length === 0}
	<p class="empty">no implants available</p>
{:else}
	<ul class="catalog">
		{#each catalog as implant (implant.id)}
			{@const owned = has(implant.id)}
			{@const discount = discounts.get(implant.id) ?? 0}
			{@const effective = Math.max(0, implant.cost - discount)}
			{@const discounted = discount > 0 && implant.cost > 0}
			{@const blocked = !owned && effective > remaining}
			{@const reqMissing = prerequisiteMissing(implant)}
			{@const isPrereq = isPrerequisiteFor(implant)}
			{@const reqName = prerequisiteName(implant)}
			<li class="entry" class:owned class:discounted>
				<div class="entry-info">
					<span class="entry-name">
						{implant.name}
						{#if discounted}
							<span class="discount-badge" title="company discount: -{discount}">deal</span>
						{/if}
					</span>
					{#if reqMissing && reqName}
						<span class="entry-req">requires: {reqName}</span>
					{/if}
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
					class="toggle"
					class:remove={owned}
					disabled={blocked || reqMissing || isPrereq}
					onclick={() => toggle(implant)}
				>
					{owned ? 'remove' : 'buy'}
				</button>
			</li>
		{/each}
	</ul>
{/if}

<style>
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

	.entry-req {
		font-size: 0.85em;
		color: #d9a04c;
		font-style: italic;
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

	.toggle {
		font-family: var(--font-mono);
		font-size: 0.95em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 0.25rem 0.6rem;
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
	}

	.toggle:hover:not(:disabled) {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.toggle.remove {
		border-color: color-mix(in srgb, #d95c5c 60%, transparent);
		color: #d95c5c;
	}

	.toggle:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	.empty {
		font-size: 1.0em;
		opacity: 0.4;
		font-style: italic;
	}
</style>
