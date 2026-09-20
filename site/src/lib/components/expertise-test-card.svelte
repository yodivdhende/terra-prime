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
	<span class="corners" aria-hidden="true"></span>

	<header class="header">
		<div class="system-line">[E.T.-4V1X]</div>
		<div class="effort">
			{#if effort === 'group'}
				<Users size="4em" />
			{:else}
				<User size="4em" />
			{/if}
			<span class="effort-label">[{effort === 'group' ? 'group' : 'single'}]</span>
		</div>
		<h2 class="title">{name.trim() === '' ? 'unnamed test' : name}</h2>
	</header>

	{#if groups.length > 0}
		<div class="expertise-groups">
			<CharacterExpertiseGroups {groups} showNames showExpertiseNames size="1.5em" />
		</div>
	{:else}
		<p class="empty">-- no targets --</p>
	{/if}
</article>

<style>
	.test-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px dashed #111;
		border-radius: 0;
		background: white;
		color: #111;
		font-family: var(--font-mono);
		break-inside: avoid;
	}

	/* `+` at each corner, the way a box drawn in characters closes itself. */
	.corners {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.test-card::before,
	.test-card::after,
	.corners::before,
	.corners::after {
		content: '+';
		position: absolute;
		font-size: 1rem;
		line-height: 1;
		color: #111;
	}

	.test-card::before {
		top: -0.5em;
		left: -0.31em;
	}

	.test-card::after {
		top: -0.5em;
		right: -0.31em;
	}

	.corners::before {
		bottom: -0.5em;
		left: -0.31em;
	}

	.corners::after {
		bottom: -0.5em;
		right: -0.31em;
	}

	.header {
		display: grid;
		grid-template-columns: 1fr min-content;
		width: 100%;
		gap: 0.5rem;
		border-bottom: 1px dashed #111;
		padding-bottom: 0.6rem;
	}

	/* The line a terminal prints above its output. */
	.system-line {
		grid-column: 1;
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.35em;
		color: #666;
	}

	.effort {
		grid-column: 2;
		grid-row: 1 / span 2;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #444;
	}

	.effort-label {
		white-space: nowrap;
	}

	.title {
		grid-column: 1;
		grid-row: 2;
		margin: 0;
		font-size: 1.15rem;
		font-weight: bold;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.title::before {
		content: '> ';
		color: #666;
	}

	/* The icon carries the meaning; the bracketed tag keeps it unambiguous on paper. */
	/*
	 * Custom properties inherit through the component boundary, so this re-themes the ProgressBar
	 * track inside CharacterExpertiseGroups without a :global() escape hatch.
	 */
	.expertise-groups {
		--progress-track: #e0e0e0;
		/* Group tints are too pale to read as text on white; the bars still carry the colour. */
		--expertise-group-name-color: #111;
		width: 100%;
		/* Same cap as the character sheet, so a card's bars are the length of the sheet's and the
		   two can be held side by side and compared directly. */
		max-width: 460px;
		color: #111;
	}

	.empty {
		margin: 0;
		font-size: 0.8rem;
		letter-spacing: 0.1em;
		color: #888;
	}
</style>
