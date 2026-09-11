<script lang="ts">
	import BackstoryLink from '$lib/components/backstory-link.svelte';

	let {
		subcoId,
		subcoName,
		backstoryId = $bindable<string | null>(),
		idEndpoint = (id: number) => `/api/subco/${id}/backstory`,
		newEndpoint = '/api/my/subco/backstory'
	}: {
		subcoId: number | null;
		subcoName: string;
		backstoryId: string | null;
		idEndpoint?: (id: number) => string;
		newEndpoint?: string;
	} = $props();
</script>

<div class="backstory">
	<span class="label">shared background</span>
	{#if subcoId != null}
		<BackstoryLink
			characterId={subcoId}
			characterName={subcoName}
			bind:backstoryId
			{idEndpoint}
			{newEndpoint}
			newPayloadKey="subcoName"
		/>
	{:else}
		<span class="hint">save the subco first to create a shared background</span>
	{/if}
</div>

<style>
	.backstory {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.label {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--color-accent);
	}

	.hint {
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: var(--color-main-dim);
	}
</style>
