<script lang="ts">
	import { goto } from '$app/navigation';
	import Promo from '$lib/components/promo.svelte';
	import { Tween } from 'svelte/motion';

	// const targetDate = new Date('2026-03-1 00:00');
	const targetDate = new Date(new Date().getTime() + 20000); // For testing, 10 seconds from now	
	let timeLeft = $state<number | null>(null);
	let fadeOut = new Tween(0);

	setInterval(() => {
		timeLeft = getTimeLeft();
	}, 1000);

	$effect(() => {
		if (timeLeft !== null && timeLeft <= 0) {
			fadeOut.set(2, { duration: 2000});
		}
	});

	$effect(() => {
		if (fadeOut.current === 2) goto('/info');
	})

	function getTimeLeft() {
		const now = new Date();
		const difference = Math.floor((targetDate.getTime() - now.getTime()) / 1000);
		if (difference < 0) return 0;
		return difference;
	}


</script>

<main>
	{#if fadeOut.current < 1}
		<Promo {timeLeft} />
	{/if}
	<div class="fade-out" style:opacity={fadeOut.current}></div>
</main>

<style>
	main {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		position: relative;
		background-color: black;
	}

	.fade-out {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 100;
		width: 100%;
		height: 100%;
		background-color: black;
		pointer-events: none;

	}

</style>
