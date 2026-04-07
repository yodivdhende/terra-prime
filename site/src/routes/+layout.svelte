<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import dhvtLogo from '$lib/assets/images/DEF_Logo_rgb_wit.png';

	onMount(() => {
		if (page.url.pathname === '/') {
			goto('/promo');
		}
	});

	let { children }: LayoutProps = $props();
</script>

<div class="scanlines"></div>
{@render children()}
<div class="dhvt-logo">
	<a href="https://dhvt.be"> powered by <img src={dhvtLogo} alt="DHVT Logo" /></a>
</div>

<style>
	.scanlines {
		pointer-events: none;
		position: fixed;
		inset: 0;
		z-index: 10;
		opacity: 1;
		transition: opacity 1s ease;
		background: repeating-linear-gradient(
			to bottom,
			transparent 0px,
			transparent 3px,
			rgba(0, 0, 0, 0.15) 3px,
			rgba(0, 0, 0, 0.15) 4px
		);
	}

	.dhvt-logo {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 10;
		color: white;
		text-align: center;
	}

	.dhvt-logo a {
		color: white;
		text-decoration: none;
	}

	.dhvt-logo img {
		width: 4em;
	}

	@media (max-width: 600px) {
		.dhvt-logo {
			font-size: 0.7rem;
		}
	}
</style>
