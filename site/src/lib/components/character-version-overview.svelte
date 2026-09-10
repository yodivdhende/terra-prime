<script lang="ts">
	import type { Expertise } from '$lib/db/expertise.repo';
	import type {
		VersionImplant,
		VersionItem,
		VersionExpertise
	} from '$lib/managers/character-manager.svelte';
	import ExpertiseOverview from './expertise-overview.svelte';

	let {
		title = 'Overview',
		expertiseCatalog,
		expertise,
		items,
		implants,
		open = false
	}: {
		title?: string;
		expertiseCatalog: Expertise[];
		expertise: VersionExpertise[];
		items: VersionItem[];
		implants: VersionImplant[];
		open?: boolean;
	} = $props();

	const expertiseValues = $derived(expertise.map((e) => ({ id: e.id, value: e.value })));
</script>

<details class="overview" {open}>
	<summary>{title}</summary>
	<div class="sections">
		<section>
			<h4>Expertise</h4>
			<ExpertiseOverview expertise={expertiseCatalog} values={expertiseValues} />
		</section>
		<section>
			<h4>Items</h4>
			{#if items.length === 0}
				<p class="empty">none</p>
			{:else}
				<ul>
					{#each items as item (item.id)}
						<li>{item.name} × {item.count}</li>
					{/each}
				</ul>
			{/if}
		</section>
		<section>
			<h4>Implants</h4>
			{#if implants.length === 0}
				<p class="empty">none</p>
			{:else}
				<ul>
					{#each implants as implant (implant.id)}
						<li>{implant.name}</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</details>

<style>
	.overview {
		border: 1px solid silver;
		border-radius: 4px;
		padding: 8px 12px;
	}

	summary {
		cursor: pointer;
		font-weight: bold;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 8px;
	}

	h4 {
		margin: 0 0 4px 0;
	}

	ul {
		margin: 0;
		padding-left: 1.2rem;
	}

	.empty {
		opacity: 0.5;
		font-size: 0.85rem;
		margin: 0;
	}
</style>
