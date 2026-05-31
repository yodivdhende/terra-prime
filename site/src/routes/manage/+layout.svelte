<script lang="ts">
	import '../../app.css';
	import Logo from '$lib/assets/images/Logo.gif';
	import Navigation from '$lib/components/navigation.svelte';
	import Toast from '$lib/components/toast.svelte';
	import { sectionManager } from '$lib/managers/section-manager.svelte';
	import { sidePanelManager } from '$lib/managers/side-panel-manager.svelte';
	import { CircleX } from '@lucide/svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<main>
	<div class="background grid--background">
		<div class="grid"></div>
		<img src={Logo} alt="terraprime logo" />
	</div>
	<header>
		<Navigation />
	</header>
	{#if sectionManager.showSection}
		<section>
			<div class="section-container">
				{@render children()}
			</div>
		</section>
	{/if}
	{#if sidePanelManager.component != null}
		<div
			role="button"
			tabindex="0"
			class="backdrop"
			onclick={() => sidePanelManager.close()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') sidePanelManager.close();
			}}
		></div>
		<aside>
			<button onclick={() => sidePanelManager.close()}><CircleX /></button>
			<sidePanelManager.component />
		</aside>
	{/if}
	<Toast />
</main>

<style>
	main {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: 1fr;
		grid-template-areas: 'header section';
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	main :global(a) {
		color: var(--color-accent);
	}

	.background {
		grid-area: section;
		background-color: black;
	}

	header {
		grid-area: header;
		background-color: black;
		z-index: 2;
		height: 100vh;
	}

	section {
		grid-area: section;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.section-container {
		color: var(--color-main);
		border: 1px solid var(--color-main);
		background-color: var(--color-bg);
	}

	.backdrop {
		position: absolute;
		width: 100vw;
		height: 100vh;
		z-index: 1000;
		background-color: rgba(0, 0, 0, 0.4);
	}

	aside {
		position: absolute;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: end;
		width: 600px;
		height: 100vh;
		z-index: 1010;
		background-color: white;
	}

	.background {
		position: absolute;
		display: grid;
		grid-template:
			'background' 1fr
			/ 1fr;
		align-items: center;
		justify-items: center;
		width: 100%;
		height: 100%;
		pointer-events: none;
		user-select: none;
	}

	.grid--background {
		--dot-size: 2px;
		--dot-opacity: 0.6;
		--line-opacity: 0.2;
		grid-area: background;
		width: 100%;
		height: 100%;
		background-size: calc(100vw / 10) calc(100vw / 10);
		background-image:
			radial-gradient(
				circle at top left,
				rgba(255, 255, 255, var(--dot-opacity)) var(--dot-size),
				transparent 1px
			),
			radial-gradient(
				circle at top right,
				rgba(255, 255, 255, var(--dot-opacity)) var(--dot-size),
				transparent 1px
			),
			radial-gradient(
				circle at bottom left,
				rgba(255, 255, 255, var(--dot-opacity)) var(--dot-size),
				transparent 1px
			),
			radial-gradient(
				circle at bottom right,
				rgba(255, 255, 255, var(--dot-opacity)) var(--dot-size),
				transparent 1px
			),
			linear-gradient(to right, rgba(255, 255, 255, var(--line-opacity)) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(255, 255, 255, var(--line-opacity)) 1px, transparent 1px);
	}

	.background img {
		grid-area: background;
		max-width: 50vw;
		max-height: 60vh;
	}
</style>
