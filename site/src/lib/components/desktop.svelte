<script lang="ts">
	import Logo from '$lib/assets/images/Logo.gif';
	import DesktopIcons from '$lib/components/desktop-icons.svelte';
	import DesktopWindows from '$lib/components/desktop-windows.svelte';
	import Toast from '$lib/components/toast.svelte';
</script>

<main>
	<div class="background grid--background">
		<div class="grid"></div>
		<img src={Logo} alt="terraprime logo" />
	</div>
	<DesktopIcons />
	<DesktopWindows />
	<Toast />
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
