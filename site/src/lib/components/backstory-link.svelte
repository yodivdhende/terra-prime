<script lang="ts">
	let {
		characterId,
		characterName,
		backstoryUrl = $bindable()
	}: {
		characterId: number | null;
		characterName?: string;
		backstoryUrl?: string | null;
	} = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

	const canCreate = $derived(
		characterId != null || (characterName != null && characterName.trim().length > 0)
	);

	async function createDoc() {
		loading = true;
		error = null;
		try {
			const res =
				characterId != null
					? await fetch(`/api/characters/${characterId}/backstory`, { method: 'POST' })
					: await fetch(`/api/my/characters/backstory`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ characterName: characterName ?? '' })
						});
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
		<button onclick={createDoc} disabled={loading || !canCreate}>
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

	a,
	button {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--color-accent);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		text-decoration: none;
	}

	a:hover,
	button:hover:not(:disabled) {
		text-decoration: underline;
	}

	button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.error {
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: #d95c5c;
	}
</style>
