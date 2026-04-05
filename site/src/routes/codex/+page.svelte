<script lang="ts">
	import Desktop from '$lib/codex/components/desktop.svelte';
	import Taskbar from '$lib/codex/components/taskbar.svelte';
</script>

<main>
	<Desktop></Desktop>
	<Taskbar></Taskbar>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
</style>
