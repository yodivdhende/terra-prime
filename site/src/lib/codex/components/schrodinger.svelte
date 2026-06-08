<script lang="ts">
	import { fly } from 'svelte/transition';
	import { SCHRODINGER_MANAGER } from '../managers/schrodinger-manager.svelte';
</script>

{#if SCHRODINGER_MANAGER.visible}
	<div class="schrodinger" transition:fly={{ y: 20, duration: 280 }}>
		<div class="bubble">
			<button class="dismiss" onclick={() => SCHRODINGER_MANAGER.dismiss()}>×</button>
			<p class="message">{SCHRODINGER_MANAGER.message}</p>
		</div>
		<pre class="cat" aria-hidden="true">
     |\__/,|   (\
   _.|o o  |_   ) )
 -(((---(((--------</pre>
	</div>
{/if}

<style>
	.schrodinger {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.4rem;
		pointer-events: auto;
	}

	.bubble {
		position: relative;
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		border: 1px solid var(--color-accent);
		padding: 0.6rem 2rem 0.6rem 0.75rem;
		max-width: 260px;
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--color-main);
		box-shadow: 0 0 12px color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.bubble::after {
		content: '';
		position: absolute;
		bottom: -7px;
		right: 18px;
		width: 0;
		height: 0;
		border-left: 6px solid transparent;
		border-right: 6px solid transparent;
		border-top: 7px solid var(--color-accent);
	}

	.dismiss {
		position: absolute;
		top: 0.2rem;
		right: 0.35rem;
		background: transparent;
		border: none;
		color: var(--color-main);
		font-family: var(--font-mono);
		font-size: 0.9em;
		cursor: pointer;
		opacity: 0.45;
		line-height: 1;
		padding: 0;
		transition: opacity 0.1s;
	}

	.dismiss:hover {
		opacity: 1;
		color: var(--color-accent);
	}

	.message {
		margin: 0;
		line-height: 1.5;
	}

	.cat {
		font-family: var(--font-mono);
		font-size: 0.65em;
		color: var(--color-accent);
		margin: 0;
		line-height: 1.3;
		animation: bob 3s ease-in-out infinite;
		white-space: pre;
		user-select: none;
	}

	@keyframes bob {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4px); }
	}
</style>
