<script lang="ts">
	let { onStart }: { onStart: () => void } = $props();
</script>

<div class="panel intro-panel">
	<div class="header-bar">+++ [ TERRA PRIME FEDERATIE — STEM TEST PROTOCOL ] +++</div>
	<div class="content">
		<p class="system-msg">INITIALISEREN... VERBINDING BEVESTIGD</p>
		<p class="system-msg">PERSOONLIJKHEIDSPROFIEL ANALYSE V2.4.1</p>
		<br />
		<p>
			Uw antwoorden worden gebruikt om uw optimale plaatsing binnen de corporate structuur van Terra
			Prime te bepalen.
		</p>
		<br />
		<p>Beantwoord elke stelling eerlijk.</p>
		<p>Uw profiel wordt vergeleken met bestaande corporaties.</p>
		<p>Een match wordt gegarandeerd.</p>
		<br />
		<p class="warning">WAARSCHUWING: Resultaten zijn bindend.</p>
		<br />
		<button class="btn" onclick={onStart}>[ START ANALYSE ]</button>
	</div>
</div>

<style>
	.panel {
		width: 100%;
		max-width: 720px;
		border: 2px solid var(--accent);
		box-shadow:
			var(--accent) 0 0 16px,
			var(--accent) 0 0 4px inset;
		background-color: var(--bg);
		overflow: hidden;
	}

	.header-bar {
		background-color: var(--accent);
		color: black;
		font-size: 0.75rem;
		font-weight: bold;
		padding: 0.4rem 1rem;
		letter-spacing: 0.05em;
	}

	.content {
		padding: 2rem;
	}

	.system-msg {
		font-size: 0.75rem;
		color: var(--text-muted);
		letter-spacing: 0.08em;
	}

	.warning {
		color: var(--warning);
		font-size: 0.85rem;
	}

	.btn {
		background: transparent;
		border: 1px solid var(--accent);
		outline: none;
		color: white;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.9rem;
		padding: 0.6rem 1.5rem;
		cursor: pointer;
		letter-spacing: 0.05em;
		border-radius: 3px;
		transition:
			background-color 0.15s,
			color 0.15s;
	}

	.btn:hover {
		background-color: var(--accent);
		color: black;
	}

	@media (max-width: 500px) {
		.content {
			padding: 1.25rem;
		}

		.header-bar {
			font-size: 0.65rem;
		}
	}
</style>
