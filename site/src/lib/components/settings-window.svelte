<script lang="ts">
	import { type CodexWindow } from '$lib/managers/window-manager.svelte';
	import { EFFECTS_MANAGER } from '$lib/managers/effects-manager.svelte';

	let { window }: { window: CodexWindow } = $props();

	const effects = [
		{
			label: 'CRT',
			get: () => EFFECTS_MANAGER.crt,
			set: (v: boolean) => (EFFECTS_MANAGER.crt = v)
		},
		{
			label: 'scanlines',
			get: () => EFFECTS_MANAGER.scanlines,
			set: (v: boolean) => (EFFECTS_MANAGER.scanlines = v)
		},
		{
			label: 'vignette',
			get: () => EFFECTS_MANAGER.vignette,
			set: (v: boolean) => (EFFECTS_MANAGER.vignette = v)
		}
	];
</script>

<div class="settings">
	<section>
		<h2>effects</h2>
		{#each effects as effect}
			<div class="row">
				<span class="label">{effect.label}</span>
				<button class="toggle" class:on={effect.get()} onclick={() => effect.set(!effect.get())}>
					{effect.get() ? 'ON' : 'OFF'}
				</button>
			</div>
		{/each}
	</section>
</div>

<style>
	.settings {
		padding: 1rem 1.25rem;
		overflow-y: auto;
		color: var(--color-main);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	h2 {
		color: var(--color-accent);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-size: 0.7em;
		margin: 0 0 0.4rem;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.3rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.label {
		opacity: 0.7;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.7em;
	}

	.toggle {
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.7em;
		letter-spacing: 0.08em;
		padding: 0.15rem 0.5rem;
		background: transparent;
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		cursor: pointer;
		opacity: 0.5;
		transition:
			opacity 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.toggle.on {
		opacity: 1;
		color: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
