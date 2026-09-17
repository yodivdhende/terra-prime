<script lang="ts">
	import { User, Users } from '@lucide/svelte';
	import CharacterExpertiseGroups, {
		type ExpertiseGroupBucket
	} from './character-expertise-groups.svelte';

	let {
		name,
		effort = 'single',
		groups = []
	}: {
		name: string;
		/** Whether one player has to clear the targets, or a group together. */
		effort?: 'single' | 'group';
		groups?: ExpertiseGroupBucket[];
	} = $props();
</script>

<article class="test-card">
	<header class="header">
		<h2 class="test-name">{name.trim() === '' ? 'unnamed test' : name}</h2>
		<div class="effort">
			{#if effort === 'group'}
				<Users size="1.6em" />
			{:else}
				<User size="1.6em" />
			{/if}
			<span class="effort-label">{effort === 'group' ? 'group' : 'single'}</span>
		</div>
	</header>

	{#if groups.length > 0}
		<div class="expertise-groups">
			<CharacterExpertiseGroups {groups} showNames showExpertiseNames size="1.5em" />
		</div>
	{:else}
		<p class="empty">no targets</p>
	{/if}
</article>

<style>
	/*
	 * Print-first, like the character sheet this is held next to: dark ink on white, independent of
	 * the app's CRT theme. Group colours still come from the data so the bars match the sheet.
	 */
	.test-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 2px solid #111;
		border-radius: 4px;
		background: white;
		color: #111;
		font-family: var(--font-mono);
		break-inside: avoid;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 2px solid #111;
		padding-bottom: 0.6rem;
	}

	.test-name {
		margin: 0;
		font-size: 1.3rem;
		font-weight: bold;
		letter-spacing: 0.02em;
	}

	/* The icon carries the meaning; the caption keeps it unambiguous on paper. */
	.effort {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		flex-shrink: 0;
	}

	.effort-label {
		font-size: 0.6rem;
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
		color: #111;
	}

	.empty {
		margin: 0;
		font-size: 0.8rem;
		color: #888;
	}
</style>
