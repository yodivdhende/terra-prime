<script lang="ts">
	import Icon from '$lib/components/icon.svelte';

	let { value = $bindable<string | null>(null) }: { value?: string | null } = $props();

	let error = $state('');

	function clear() {
		error = '';
		value = null;
	}

	function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = typeof reader.result === 'string' ? reader.result : '';
			if (text.includes('<svg')) {
				error = '';
				value = text;
			} else {
				error = 'That file does not look like an SVG';
			}
		};
		reader.onerror = () => {
			error = 'Could not read the file';
		};
		reader.readAsText(file);
		// allow re-selecting the same file later
		input.value = '';
	}
</script>

<div class="icon-picker">
	<div class="controls">
		<label class="upload">
			upload svg
			<input type="file" accept=".svg,image/svg+xml" onchange={onFileChange} />
		</label>
		{#if value}
			<span class="preview">
				<Icon src={value} size="1.8rem" />
			</span>
			<button type="button" class="clear" onclick={clear}>clear</button>
		{:else}
			<span class="preview preview--empty">no icon</span>
		{/if}
	</div>

	{#if error}
		<span class="error">{error}</span>
	{/if}
</div>

<style>
	.icon-picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.upload {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85em;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
	}

	.upload input {
		font-size: 0.8em;
	}

	.preview {
		display: inline-flex;
		align-items: center;
		color: var(--color-accent);
	}

	.preview--empty {
		font-size: 0.85em;
		opacity: 0.5;
		font-style: italic;
	}

	.clear {
		background: none;
		border: none;
		color: inherit;
		opacity: 0.6;
		cursor: pointer;
		font-size: 0.8em;
		text-decoration: underline;
	}

	.error {
		font-size: 0.8em;
		color: var(--color-warning, #d95c5c);
	}
</style>
