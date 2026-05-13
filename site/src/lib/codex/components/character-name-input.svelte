<script lang="ts">
	let {
		value = $bindable('')
	}: {
		value: string;
	} = $props();
</script>

<label class="name-field">
	<span class="label">name</span>
	<input
		type="text"
		bind:value
		placeholder="character name"
		required
		aria-invalid={value.trim().length === 0}
	/>
</label>

<style>
	.name-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.label {
		font-size: 0.6rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	.name-field input {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		background: transparent;
		color: var(--color-main);
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		padding: 0.2rem 0;
		outline: none;
	}

	.name-field input:focus {
		border-bottom-color: var(--color-accent);
	}

	.name-field input[aria-invalid='true'] {
		border-bottom-color: color-mix(in srgb, #d95c5c 60%, transparent);
	}
</style>
