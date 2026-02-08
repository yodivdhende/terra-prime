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

{@render children()}
<div class="dhvt-logo">
	<a href="https://dhvt.be"> powered by <img src={dhvtLogo} alt="DHVT Logo" /></a>
</div>

<style>
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
		width: 4rem;
	}
</style>
