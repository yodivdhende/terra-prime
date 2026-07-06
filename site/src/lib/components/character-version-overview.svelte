<script lang="ts">
	import type { Skill } from '$lib/db/skills.repo';
	import type {
		VersionImplant,
		VersionItem,
		VersionSkill
	} from '$lib/codex/managers/character-manager.svelte';
	import SkillsOverview from './skills-overview.svelte';

	let {
		title = 'Overview',
		skillCatalog,
		skills,
		items,
		implants,
		open = false
	}: {
		title?: string;
		skillCatalog: Skill[];
		skills: VersionSkill[];
		items: VersionItem[];
		implants: VersionImplant[];
		open?: boolean;
	} = $props();

	const skillValues = $derived(skills.map((s) => ({ id: s.id, value: s.value })));
</script>

<details class="overview" {open}>
	<summary>{title}</summary>
	<div class="sections">
		<section>
			<h4>Skills</h4>
			<SkillsOverview skills={skillCatalog} values={skillValues} />
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
