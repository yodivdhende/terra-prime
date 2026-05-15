<script lang='ts'>
	import '../../app.css';
	import Navigation from '$lib/components/navigation.svelte';
	import { sectionManager } from '$lib/managers/section-manager.svelte';
	import { sidePanelManager } from '$lib/managers/side-panel-manager.svelte';
	import { CircleX } from '@lucide/svelte';
	import type { LayoutProps } from './$types';
	import Scene from '$lib/scene.svelte';

	let { children }: LayoutProps = $props();
</script>
<main>
	<div class="background">
		<Scene />
	</div>
	<header>
		<Navigation />
	</header>
	{#if sectionManager.showSection}
		<section>
			{@render children()}
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
</main>

<style>
	main {
		display: grid;
		grid-template-rows: auto 1fr;
		grid-template-areas:
			'header'
			'section';
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}

	.background {
		grid-area: section;
		background-color: black;
	}

	header {
		grid-area: header;
		background-color: black;
		z-index: 2;
	}

	section {
		grid-area: section;
		width: 100%;
		height: 100%;
		z-index: 1;
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
</style>