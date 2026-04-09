<script lang="ts">
	import Logo from '$lib/assets/images/Logo.png';
	import DesktopIcons from '$lib/codex/components/desktop-icons.svelte';
	import DesktopWindows from '$lib/codex/components/desktop-windows.svelte';
</script>

<main>
	<div class="background">
		<img src={Logo} alt="terraprime logo" />
	</div>
	<DesktopIcons />
	<DesktopWindows />
	<div class="vignette"></div>
</main>

<style>
	main {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: var(--bg);
		overflow: hidden;
	}

	.vignette {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(ellipse at center, transparent 60%, rgba(0, 0, 0, 0.6) 100%);
		z-index: 9999;
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

	.background img {
		grid-area: background;
		max-width: 50vw;
		max-height: 60vh;
	}
</style>
