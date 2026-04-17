<script lang="ts">
	let {
		company,
		onRestart
	}: {
		company: { name: string; domain: string; description: string; result: string };
		onRestart: () => void;
	} = $props();
</script>

<div class="panel result-panel">
	<div class="header-bar">+++ [ CORPORATE MATCH: {company.name} ] +++</div>
	<div class="content">
		<p class="system-msg">ANALYSE VOLTOOID — PROFIEL GECLASSIFICEERD</p>
		<br />
		<p class="domain">DOMEIN: {company.domain}</p>
		<br />
		<p class="result-text">{company.result}</p>
		<br />
		<p class="description">{company.description}</p>
		<br />
		<button class="btn secondary" onclick={onRestart}>[ HERSTART ANALYSE ]</button>
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

	.domain {
		font-size: 0.8rem;
		color: var(--text-muted);
		letter-spacing: 0.1em;
	}

	.result-text {
		white-space: pre-line;
		line-height: 1.8;
		color: var(--text-result);
		font-size: 0.95rem;
		border-left: 2px solid var(--accent);
		padding-left: 1rem;
	}

	.description {
		font-size: 0.85rem;
		color: var(--text-subtle);
		line-height: 1.6;
		font-style: italic;
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

	.btn.secondary {
		border-color: var(--border-dim);
		color: var(--text-dim);
	}

	.btn.secondary:hover {
		background-color: var(--hover-bg);
		color: white;
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
