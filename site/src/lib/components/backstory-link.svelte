<script lang="ts">
	let {
		characterId,
		characterName,
		backstoryId = $bindable(),
		idEndpoint = (id: number) => `/api/characters/${id}/backstory`,
		newEndpoint = '/api/my/characters/backstory',
		newPayloadKey = 'characterName'
	}: {
		characterId: number | null;
		characterName?: string;
		backstoryId?: string | null;
		idEndpoint?: (id: number) => string;
		newEndpoint?: string;
		newPayloadKey?: string;
	} = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);

	const canCreate = $derived(
		characterId != null || (characterName != null && characterName.trim().length > 0)
	);

	const docUrl = $derived(
		backstoryId ? `https://docs.google.com/document/d/${backstoryId}/edit` : null
	);

	async function createDoc() {
		loading = true;
		error = null;
		try {
			const res =
				characterId != null
					? await fetch(idEndpoint(characterId), { method: 'POST' })
					: await fetch(newEndpoint, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ [newPayloadKey]: characterName ?? '' })
						});
			if (!res.ok) {
				error = 'Failed to create backstory document';
				return;
			}
			const data = await res.json();
			backstoryId = data.id;
		} catch {
			error = 'Failed to create backstory document';
		} finally {
			loading = false;
		}
	}
</script>

<div class="backstory">
	{#if docUrl}
		<a href={docUrl} target="_blank" rel="noopener noreferrer external">Open Backstory</a>
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
