<script lang="ts">
	import { Search } from '@lucide/svelte';
	import { WINDOW_MANAGER } from '$lib/codex/services/window-manager.svelte';

	type DriveFile = { id: string; name: string; mimeType: string };

	let expanded = $state(false);
	let query = $state('');
	let results = $state<DriveFile[]>([]);
	let searching = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl: HTMLInputElement | undefined = $state();

	function toggle() {
		expanded = !expanded;
		if (expanded) {
			setTimeout(() => inputEl?.focus(), 0);
		} else {
			reset();
		}
	}

	function reset() {
		query = '';
		results = [];
		searching = false;
		clearTimeout(debounceTimer);
	}

	function onInput() {
		clearTimeout(debounceTimer);
		if (query.trim().length < 2) {
			results = [];
			return;
		}
		searching = true;
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/drive/search?q=${encodeURIComponent(query.trim())}`);
				if (res.ok) results = await res.json();
			} finally {
				searching = false;
			}
		}, 300);
	}

	function selectFile(file: DriveFile) {
		WINDOW_MANAGER.addWindows([file]);
		WINDOW_MANAGER.openWindow({ id: file.id });
		WINDOW_MANAGER.focusWindow(file.id);
		expanded = false;
		reset();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			expanded = false;
			reset();
		}
	}

	function mimeLabel(mimeType: string): string {
		if (mimeType.includes('folder')) return 'folder';
		if (mimeType.includes('document')) return 'doc';
		if (mimeType.includes('pdf')) return 'pdf';
		if (mimeType.includes('image')) return 'img';
		return 'file';
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="search">
	<button class="icon-btn" onclick={toggle} aria-label="Search files">
		<Search size={32} />
	</button>

	{#if expanded}
		<div class="dropdown">
			<ul class="results">
				{#if query.trim().length < 2}
					<li class="empty">type to search</li>
				{:else if searching}
					<li class="empty">searching...</li>
				{:else if results.length === 0}
					<li class="empty">no results</li>
				{:else}
					{#each results as file}
						<li>
							<button class="result-item" onclick={() => selectFile(file)}>
								<span class="result-name">{file.name}</span>
								<span class="result-type">{mimeLabel(file.mimeType)}</span>
							</button>
						</li>
					{/each}
				{/if}
			</ul>

			<div class="input-row">
				<Search size={14} class="input-icon" />
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={onInput}
					class="search-input"
					type="text"
					placeholder="search files..."
					autocomplete="off"
					spellcheck="false"
				/>
				{#if searching}
					<span class="hint">...</span>
				{/if}
			</div>
		</div>

		<button class="backdrop" onclick={toggle} aria-label="Close search" tabindex="-1"></button>
	{/if}
</div>

<style>
	.search {
		position: relative;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg);
		border: var(--border-width) solid var(--color-accent);
		padding: 1em;
		margin: calc(var(--border-width) * -1);
		color: var(--color-main);
		cursor: pointer;
		transition: color 0.15s;
	}

	.icon-btn:hover {
		background-color: var(--color-accent);
		color: var(--color-bg);
	}

	.icon-btn:active {
		background-color: var(--color-main);
		color: var(--color-bg);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		background: transparent;
		z-index: 99;
		border: none;
		cursor: default;
	}

	.dropdown {
		position: absolute;
		bottom: calc(100% + 10px);
		left: 0;
		width: 320px;
		background: var(--color-bg);
		border: var(--border-width) solid var(--color-main);
		box-shadow:
			var(--color-main) 0 0 16px,
			var(--color-main) 0 0 4px inset;
		z-index: 100;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-size: 1.5em;
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.75rem;
		background-color: var(--color-bg);
		border-top: var(--border-width) solid var(--color-main);
		color: var(--color-accent);
	}

	.input-row :global(.input-icon) {
		flex-shrink: 0;
	}

	.search-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--color-accent);
		font-family: inherit;
		font-weight: bold;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		outline: none;
		font-size: 1em;
	}

	.search-input::placeholder {
		color: var(--color-accent);
		font-weight: bold;
		text-transform: uppercase;
	}

	.hint {
		color: var(--color-accent);
		font-weight: bold;
		flex-shrink: 0;
	}

	.results {
		list-style: none;
		margin: 0;
		padding: 0.25rem 0;
		max-height: 320px;
		overflow-y: auto;
		background-color: var(--color-bg);
	}

	.empty {
		padding: 0.5rem 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-main-result);
		text-shadow: var(--phosphor-glow-shadow);
	}

	.result-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		width: 100%;
		padding: 0.35rem 0.75rem;
		background: none;
		border: none;
		color: var(--color-main-result);
		font-family: inherit;
		letter-spacing: 0.03em;
		line-height: 1.6;
		text-align: left;
		cursor: pointer;
		text-shadow: var(--phosphor-glow-shadow);
		transition: color 0.1s;
		font-size: 1em;
	}

	.result-item:hover {
		opacity: 1;
		color: var(--color-accent);
	}

	.result-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.result-type {
		flex-shrink: 0;
		opacity: 0.4;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
</style>
