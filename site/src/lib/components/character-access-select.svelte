<script lang="ts">
	type Character = { id: number; name: string; ownerName: string };

	let {
		characters = [],
		selectedIds = $bindable<number[]>([])
	}: {
		characters: Character[];
		selectedIds: number[];
	} = $props();

	let query = $state('');
	let isOpen = $state(false);
	let focusedIndex = $state(-1);

	const selected = $derived(characters.filter((c) => selectedIds.includes(c.id)));
	const unselected = $derived(characters.filter((c) => !selectedIds.includes(c.id)));
	const filtered = $derived(
		query.trim().length > 0
			? unselected.filter(
					(c) =>
						c.name.toLowerCase().includes(query.toLowerCase()) ||
						c.ownerName.toLowerCase().includes(query.toLowerCase())
				)
			: unselected
	);

	function add(character: Character) {
		selectedIds = [...selectedIds, character.id];
		query = '';
		focusedIndex = -1;
	}

	function remove(id: number) {
		selectedIds = selectedIds.filter((sid) => sid !== id);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			isOpen = true;
			focusedIndex = Math.min(focusedIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			focusedIndex = Math.max(focusedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			if (focusedIndex >= 0 && filtered[focusedIndex]) {
				e.preventDefault();
				add(filtered[focusedIndex]);
			}
		} else if (e.key === 'Escape') {
			isOpen = false;
			focusedIndex = -1;
		}
	}

	function onBlur() {
		setTimeout(() => {
			isOpen = false;
			focusedIndex = -1;
		}, 150);
	}
</script>

<div class="character-access-select">
	{#if selected.length > 0}
		<div class="tags">
			{#each selected as character (character.id)}
				<span class="tag">
					{character.name}
					<button type="button" class="tag-remove" onclick={() => remove(character.id)}>×</button>
				</span>
			{/each}
		</div>
	{/if}

	<div class="input-wrap">
		<input
			type="text"
			bind:value={query}
			placeholder="search characters…"
			oninput={() => { isOpen = true; focusedIndex = -1; }}
			onfocus={() => (isOpen = true)}
			onblur={onBlur}
			onkeydown={onKeydown}
			autocomplete="off"
			role="combobox"
			aria-expanded={isOpen}
			aria-autocomplete="list"
		/>
		{#if isOpen && filtered.length > 0}
			<ul class="dropdown scroll" role="listbox">
				{#each filtered as character, i (character.id)}
					<li
						class:focused={i === focusedIndex}
						role="option"
						aria-selected={i === focusedIndex}
						onmousedown={() => add(character)}
					>
						{character.name}
						<span class="owner">({character.ownerName})</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.character-access-select {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 4px;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border: 1px solid color-mix(in srgb, var(--color-accent) 50%, transparent);
		color: var(--color-accent);
		font-size: 0.8rem;
	}

	.tag-remove {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		padding: 0;
		opacity: 0.7;
	}

	.tag-remove:hover {
		opacity: 1;
	}

	.input-wrap {
		position: relative;
	}

	input {
		width: 100%;
		background: var(--color-bg);
		color: var(--color-main);
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
		padding: 5px 10px;
		font-family: var(--font-mono);
		font-size: 0.9rem;
		outline: none;
		box-sizing: border-box;
	}

	input::placeholder {
		opacity: 0.3;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border);
		border-top: none;
		margin: 0;
		padding: 0;
		list-style: none;
		max-height: 200px;
		overflow-y: auto;
	}

	li {
		padding: 5px 10px;
		cursor: pointer;
		color: var(--color-main-dim);
		display: flex;
		gap: 6px;
		align-items: baseline;
	}

	li:hover,
	li.focused {
		background: var(--hover-bg, #333);
		color: var(--color-main);
	}

	li.focused {
		color: var(--color-accent);
	}

	.owner {
		font-size: 0.8em;
		opacity: 0.5;
	}
</style>
