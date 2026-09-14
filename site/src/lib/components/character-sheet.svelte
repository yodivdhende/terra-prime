<script lang="ts">
	import CharacterExpertiseGroups from './character-expertise-groups.svelte';
	import type { VersionExpertise, VersionImplant } from '$lib/managers/character-manager.svelte';

	let {
		characterName,
		versionName = null,
		companyName = null,
		ownerName = null,
		eventName = null,
		expertise = [],
		implants = []
	}: {
		characterName: string;
		versionName?: string | null;
		companyName?: string | null;
		ownerName?: string | null;
		eventName?: string | null;
		expertise?: VersionExpertise[];
		implants?: VersionImplant[];
	} = $props();

	const orderedImplants = $derived([...implants].sort((a, b) => a.slot - b.slot));
</script>

<article class="character-sheet">
	<header class="header">
		<h1 class="character-name">{characterName}</h1>
		<div class="meta">
			{#if versionName}<span>{versionName}</span>{/if}
			{#if companyName}<span>{companyName}</span>{/if}
			{#if ownerName}<span>played by {ownerName}</span>{/if}
			{#if eventName}<span>{eventName}</span>{/if}
		</div>
	</header>

	<section class="section">
		<h2 class="section-label">expertise</h2>
		{#if expertise.length > 0}
			<div class="expertise-groups">
				<CharacterExpertiseGroups {expertise} showNames showExpertiseNames size="1.5em" />
			</div>
		{:else}
			<p class="empty">no expertise</p>
		{/if}
	</section>

	<section class="section">
		<h2 class="section-label">implants</h2>
		{#if orderedImplants.length > 0}
			<ul class="entry-list">
				{#each orderedImplants as implant (implant.id)}
					<li class="entry">
						<span class="entry-slot">slot {implant.slot}</span>
						<span class="entry-name">{implant.name}</span>
						{#if implant.description}
							<span class="entry-desc">{implant.description}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="empty">no implants</p>
		{/if}
	</section>
</article>

<style>
	/*
	 * Print-first: dark ink on white, independent of the app's CRT theme. Group colours still come
	 * from the data for bars and icons, but text stays near-black so legibility never depends on how
	 * pale a group's colour happens to be.
	 */
	.character-sheet {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1.5rem;
		background: white;
		color: #111;
		font-family: var(--font-mono);
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		border-bottom: 2px solid #111;
		padding-bottom: 0.6rem;
	}

	.character-name {
		margin: 0;
		font-size: 1.8rem;
		font-weight: bold;
		letter-spacing: 0.02em;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.8rem;
		color: #444;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		break-inside: avoid;
	}

	.section-label {
		margin: 0;
		font-size: 0.7rem;
		font-weight: normal;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #666;
	}

	/*
	 * Custom properties inherit through the component boundary, so this re-themes the ProgressBar
	 * track inside CharacterExpertiseGroups without a :global() escape hatch.
	 */
	.expertise-groups {
		--progress-track: #e0e0e0;
		/* Group tints are too pale to read as text on white; the bars still carry the colour. */
		--expertise-group-name-color: #111;
		width: 100%;
		max-width: 460px;
		color: #111;
	}

	.entry-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry {
		display: grid;
		grid-template:
			'slot name'
			'slot desc'
			/ 5rem 1fr;
		column-gap: 0.75rem;
		border-bottom: 1px solid #ddd;
		padding-bottom: 0.4rem;
		break-inside: avoid;
	}

	.entry-slot {
		grid-area: slot;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #666;
	}

	.entry-name {
		grid-area: name;
		font-weight: bold;
	}

	.entry-desc {
		grid-area: desc;
		font-size: 0.8rem;
		color: #333;
	}

	.empty {
		margin: 0;
		font-size: 0.8rem;
		color: #888;
	}
</style>
