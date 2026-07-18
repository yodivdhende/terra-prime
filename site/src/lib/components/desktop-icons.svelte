<script lang="ts">
	import { ICON_MANAGER, type Icon } from '$lib/managers/icon-manager.svelte';
	import { WINDOW_MANAGER } from '$lib/managers/window-manager.svelte';
	import { File, Folder, Image, FileHeadphone, Settings, ClipboardPen, UserRound, ClipboardPenLine, IdCard, Building2 } from '@lucide/svelte';

	let icons = $derived(ICON_MANAGER.icons);
	let localIcons = $derived(icons.filter(i => i.side === 'left'));
	let driveIcons = $derived(icons.filter(i => i.side === 'right'));

	function openWindow(icon: Icon) {
		const { windowId } = $state.snapshot(icon);
		icon.windowId = WINDOW_MANAGER.openWindow({ id: windowId });
	}
</script>

{#snippet iconButton(icon: Icon)}
	{#if icon.type === 'file'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><File size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'dir'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><Folder size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'image'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><Image size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'audio'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><FileHeadphone size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'settings'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><Settings size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'playtest'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><ClipboardPen size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'login'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><UserRound size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'register'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><ClipboardPenLine size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'characterOverview'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><IdCard size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'subco'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><Building2 size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
	{#if icon.type === 'form'}
		<button onclick={() => openWindow(icon)}>
			<div class="icon"><ClipboardPen size={64} strokeWidth={1} /></div>
			{icon.title}
		</button>
	{/if}
{/snippet}

<main>
	<section class="local">
		{#each localIcons as icon (icon.windowId)}
			{@render iconButton(icon)}
		{/each}
	</section>
	<section class="drive">
		{#each driveIcons as icon (icon.windowId)}
			{@render iconButton(icon)}
		{/each}
	</section>
</main>

<style>
	main {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: space-between;
		pointer-events: none;
	}

	section {
		display: grid;
		margin: 2rem;
		gap: 1.5rem;
		grid-template-columns: repeat(3, min-content);
		align-content: start;
		pointer-events: auto;
	}

	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		width: 100px;
		color: var(--color-main-dim);
		outline: none;
		border: 1px solid transparent;
		cursor: pointer;
		padding: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.7em;
		letter-spacing: 0.05em;
		transition:
			color 0.1s,
			border-color 0.1s,
			text-shadow 0.1s,
			filter 0.1s;
		background-color: black;
	}

	.icon {
		background-color: var(--color-bg);
		z-index: 1;
	}

	button:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
		text-shadow: var(--phosphor-glow-color);
		filter: drop-shadow(0 0 6px var(--phosphor-glow-color));
	}

	button:hover .icon {
		border-color: var(--color-accent);
	}

	button:active {
		background-color: var(--color-accent);
		color: var(--color-bg);
	}

	button:active .icon {
		background-color: var(--color-accent);
	}
</style>
