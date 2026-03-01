<script lang="ts">
	import { Canvas } from '@threlte/core';
	import PromoAnimation from '$lib/assets/gltf/promo-animation.svelte';
	import { fade, fly } from 'svelte/transition';
	import pacman from '$lib/assets/images/pacman_open.gif';
	import PromoSidePanel from '$lib/components/side-panels/promo-side-panel.svelte';
	import CodeScroller from '$lib/components/code-scroller.svelte';
	import { Tween } from 'svelte/motion';
	import { setPromoAnimationManagerContext } from '$lib/managers/promo-animation-manager.svelte';

    let {timeLeft}: {timeLeft: number | null} = $props();
	let showInput = $state(false);
	let showSidePanel = $state(false);
	let codeValue = $state('');
	let pacmanLeftDefault = -200;
	let pacmanLeft = new Tween(pacmanLeftDefault);

	const animationManager = setPromoAnimationManagerContext();
	animationManager.registerAnimation({
		animation: pacmanAnimation
	});

	function onWorldClick() {
		showInput = true;
	}

	function onCodeKeyUp(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			if (codeValue.trim() === 'Avix74') {
				showSidePanel = true;
				showInput = false;
			}
			codeValue = '';
		}
	}

	function pacmanAnimation() {
		pacmanLeft.set(100, { duration: 4000 });
		setTimeout(() => {
			pacmanLeft.set(pacmanLeftDefault, { duration: 0 });
		}, 5000);
	}
</script>

	<img
		src={pacman}
		alt="Pacman of dhvtlogo"
		class="pacman-logo"
		style:left={`${pacmanLeft.current}%`}
	/>
	<div class="grid">
		<div class="code">
			<CodeScroller />
		</div>
		<div class="background">
			<Canvas>
				<PromoAnimation {onWorldClick} />
			</Canvas>
		</div>
		<div class="title">TerraPrime</div>
		{#if showInput}
			<div class="input">
				<input type="text" bind:value={codeValue} onkeyup={onCodeKeyUp} />
			</div>
		{/if}
		<div class="count-down">
			{timeLeft}
		</div>
	</div>
	{#if showSidePanel}
		<div class="side-panel" in:fly={{ x: 500 }} out:fade>
			<PromoSidePanel />
		</div>
	{/if}
<style>
	.pacman-logo {
		position: absolute;
		top: 2rem;
		height: 50vh;
	}

	.grid {
		width: 100vw;
		height: 100vh;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: 1fr minmax(200px, 1.5fr) 1fr;
		grid-template-areas:
			'. 	title				.'
			'. 	input				.'
			'.  count-down 	.';
		color: #00ff00;
		font-family: 'Courier New', Courier, monospace;
		z-index: 1;
	}

	.code {
		grid-column: 1/ -1;
		grid-row: 1/ -1;
		z-index: 1;
	}

	.background {
		grid-column: 1/ -1;
		grid-row: 1/ -1;
		z-index: 1;
	}

	.title {
		grid-area: title;
		align-self: end;
		z-index: 1;
		font-size: min(5rem, 15vw);
		font-weight: bold;
		text-align: center;
		padding: auto;
	}

	.input {
		grid-area: input;
		align-self: center;
		justify-self: center;
		z-index: 2;
		width: 100%;
	}

	.input input {
		width: 100%;
		border: none;
		outline: none;
		text-align: center;
		color: green;
		font-size: 2rem;
		background-color: black;
	}

	.count-down {
		grid-area: count-down;
		align-self: top;
		z-index: 1;
		font-size: 2rem;
		font-weight: bold;
		text-align: center;
	}

	.side-panel {
		position: absolute;
		top: 0;
		right: 0;
		width: min(500px, calc(100vw - 2rem - 4px));
		height: calc(100vh - 2rem - 2px);
		color: #00ff00;
		font-family: 'Courier New', Courier, monospace;
		padding: 1rem;
		border: 1px solid #00ff00;
		background-color: rgba(0, 0, 0, 0.95);
		z-index: 2;
	}

	@media (max-width: 768px) {
		.side-panel {
			width: 100%;
		}
	}
</style>