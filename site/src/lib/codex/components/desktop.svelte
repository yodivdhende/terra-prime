<script lang="ts">
	import Logo from '$lib/assets/images/Logo.png';
	import DesktopIcons from '$lib/codex/components/desktop-icons.svelte';
	import DesktopWindows from '$lib/codex/components/desktop-windows.svelte';
</script>

<main>
	<div class="background">
		<img src={Logo} alt="terraprime logo" />
		<div class="grid"></div>
	</div>
	<DesktopIcons />
	<DesktopWindows />
</main>

<style>
	main {
		position: relative;
		width: 100%;
		height: 100%;
		background-color: var(--bg);
		overflow: hidden;
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

	.background .grid {
		--dot-size: 2px;
		grid-area: background;
		width: 100%;
		height: 100%;
		opacity: 0.3;
		background-size: 100px 100px;
		background-image:
			radial-gradient(circle at top left, #ffffff var(--dot-size), transparent 1px),
			radial-gradient(circle at top right, #ffffff var(--dot-size), transparent 1px),
			radial-gradient(circle at bottom left, #ffffff var(--dot-size), transparent 1px),
			radial-gradient(circle at bottom right, #ffffff var(--dot-size), transparent 1px),
			linear-gradient(to right, #555555 1px, transparent 1px),
			linear-gradient(to bottom, #555555 1px, transparent 1px);
	}

	.background img {
		grid-area: background;
		max-width: 50vw;
		max-height: 60vh;
	}
</style>
