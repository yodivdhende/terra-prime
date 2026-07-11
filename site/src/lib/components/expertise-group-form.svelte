<script lang="ts">
	import type { ExpertiseGroup } from '$lib/db/expertise.repo';
	import IconPicker from '$lib/components/icon-picker.svelte';

	let { group = $bindable<ExpertiseGroup>() }: { group: ExpertiseGroup } = $props();
</script>

<main>
	<label for="name">name</label>
	<input id="name" type="text" bind:value={group.name} />
	<label for="description">description</label>
	<input type="textarea" bind:value={group.description} />
	<label for="color">color</label>
	<input
		id="color"
		type="color"
		value={group.color ?? '#4a9edd'}
		oninput={(e) => (group.color = e.currentTarget.value)}
	/>
	<span>icon</span>
	<IconPicker bind:value={group.icon} />
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
