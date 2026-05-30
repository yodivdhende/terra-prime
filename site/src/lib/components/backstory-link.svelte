<script lang="ts">
	let { characterId, backstoryUrl: initialUrl }: { characterId: number; backstoryUrl?: string | null } = $props();

	let backstoryUrl = $state(initialUrl ?? null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function createDoc() {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/characters/${characterId}/backstory`, { method: 'POST' });
			if (!res.ok) {
				error = 'Failed to create backstory document';
				return;
			}
			const data = await res.json();
			backstoryUrl = data.url;
		} catch {
			error = 'Failed to create backstory document';
		} finally {
			loading = false;
		}
	}
</script>

<div class="backstory">
	{#if backstoryUrl}
		<a href={backstoryUrl} target="_blank" rel="noopener noreferrer">Open Backstory</a>
	{:else}
		<button onclick={createDoc} disabled={loading}>
			{loading ? 'Creating...' : 'Create Backstory Document'}
		</button>
		{#if error}
			<span class="error">{error}</span>
		{/if}
	{/if}
</div>

<style>
	.backstory {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.error {
		color: red;
		font-size: 0.875rem;
	}
</style>
