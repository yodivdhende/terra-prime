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

	let {
		catalog,
		selected = $bindable<VersionImplant[]>([]),
		remaining
	}: {
		catalog: ShopImplant[];
		selected: VersionImplant[];
		remaining: number;
	} = $props();

	function has(id: number) {
		return selected.some((i) => i.id === id);
	}

	function toggle(implant: ShopImplant) {
		if (has(implant.id)) {
			selected = selected.filter((i) => i.id !== implant.id);
		} else {
			if (implant.cost > remaining) return;
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
			{@const blocked = !owned && implant.cost > remaining}
			<li class="entry" class:owned>
				<div class="entry-info">
					<span class="entry-name">{implant.name}</span>
					{#if implant.description}
						<span class="entry-desc">{implant.description}</span>
					{/if}
				</div>
				<span class="entry-cost">{implant.cost}</span>
				<button
					type="button"
					class="toggle"
					class:remove={owned}
					disabled={blocked}
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

	.entry-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.entry-name {
		font-size: 1.05rem;
		letter-spacing: 0.03em;
	}

	.entry-desc {
		font-size: 0.95rem;
		opacity: 0.5;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.entry-cost {
		font-size: 1.05rem;
		color: var(--color-accent);
		opacity: 0.7;
		min-width: 2ch;
		text-align: right;
	}

	.toggle {
		font-family: var(--font-mono);
		font-size: 0.95rem;
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
		font-size: 1.0rem;
		opacity: 0.4;
		font-style: italic;
	}
</style>
