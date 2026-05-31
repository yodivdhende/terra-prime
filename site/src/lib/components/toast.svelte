<script lang="ts">
	import { fly } from 'svelte/transition';
	import { TOAST_MANAGER, type ToastItem } from '$lib/managers/toast-manager.svelte';
</script>

<div class="toast-container">
	{#each TOAST_MANAGER.toasts as toast (toast.id)}
		<div
			class="toast toast--{toast.type}"
			role="alert"
			transition:fly={{ x: 80, duration: 250 }}
			onclick={() => TOAST_MANAGER.remove(toast.id)}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') TOAST_MANAGER.remove(toast.id);
			}}
			tabindex="0"
		>
			{toast.message}
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		z-index: 9999;
		pointer-events: none;
	}

	.toast {
		pointer-events: all;
		padding: 0.75rem 1.25rem;
		font-family: var(--font-mono);
		font-size: 0.875rem;
		cursor: pointer;
		border-width: 1px;
		border-style: solid;
		max-width: 320px;
		word-break: break-word;
	}

	.toast--success {
		color: var(--color-accent);
		border-color: var(--color-accent);
		background-color: rgba(0, 204, 0, 0.1);
	}

	.toast--warning {
		color: var(--color-warning);
		border-color: var(--color-warning);
		background-color: rgba(204, 68, 68, 0.1);
	}

	.toast--error {
		color: var(--color-warning);
		border-color: var(--color-warning);
		background-color: rgba(204, 68, 68, 0.18);
		border-width: 2px;
	}
</style>
