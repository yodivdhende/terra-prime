<script lang="ts">
	type Option = { label: string; value: string };

	let {
		options = [],
		value = $bindable(''),
		placeholder = 'Search...',
		onselect
	}: {
		options: Option[];
		value?: string;
		placeholder?: string;
		onselect?: (option: Option) => void;
	} = $props();

	let query = $state('');
	let focusedIndex = $state(-1);
	let isOpen = $state(false);

	let filtered = $derived(
		options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
	);

	function selectOption(option: Option) {
		value = option.value;
		query = option.label;
		isOpen = false;
		focusedIndex = -1;
		onselect?.(option);
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Tab') {
			if (!isOpen || filtered.length === 0) return;
			e.preventDefault();
			focusedIndex = (focusedIndex + 1) % filtered.length;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			isOpen = true;
			focusedIndex = Math.min(focusedIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			focusedIndex = Math.max(focusedIndex - 1, 0);
		} else if (e.key === 'Enter') {
			if (focusedIndex >= 0 && filtered[focusedIndex]) {
				e.preventDefault();
				selectOption(filtered[focusedIndex]);
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

<div class="search-select">
	<input
		type="text"
		bind:value={query}
		{placeholder}
		oninput={() => {
			isOpen = true;
			focusedIndex = -1;
		}}
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
			{#each filtered as option, i (option.value)}
				<li
					class:focused={i === focusedIndex}
					role="option"
					aria-selected={i === focusedIndex}
					onmousedown={() => selectOption(option)}
				>
					{option.label}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search-select {
		position: relative;
		width: 100%;
		font-family: var(--font-mono);
	}

	input {
		width: 100%;
		background: var(--color-bg);
		color: var(--color-main);
		border: none;
		padding: 6px 10px;
		font-family: var(--font-mono);
		font-size: 1rem;
		outline: none;
		box-sizing: border-box;
	}

	.dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 100;
		background: var(--color-bg-panel);
		border: var(--border-width) solid var(--color-border);
		border-top: none;
		margin: 0;
		padding: 0;
		list-style: none;
		max-height: 220px;
		overflow-y: auto;
	}

	li {
		padding: 6px 10px;
		cursor: pointer;
		color: var(--color-main-dim);
	}

	li:hover {
		background: var(--hover-bg, #333);
		color: var(--color-main);
	}

	li.focused {
		background: var(--hover-bg, #333);
		color: var(--color-accent);
	}
</style>
