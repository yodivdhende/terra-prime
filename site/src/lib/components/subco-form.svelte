<script lang="ts">
	import type { Subco } from '$lib/db/subco.repo';
	import type { Company } from '$lib/db/companies.repo';
	import type { Character } from '$lib/db/character.repo';
	import CompanySelect from '$lib/components/company-select.svelte';
	import SearchSelect from '$lib/components/search-select.svelte';

	let {
		subco = $bindable<Subco>(),
		charactersEndpoint = '/api/characters'
	}: {
		subco: Subco;
		charactersEndpoint?: string;
	} = $props();

	$inspect(subco);

	let characters = $state<Character[]>([]);
	let memberQuery = $state('');

	let memberOptions = $derived(
		characters
			.filter((c) => !subco.members.includes(c.id))
			.map((c) => ({ label: `${c.name} (${c.ownerName})`, value: String(c.id) }))
	);

	// company-select binds a whole Company object; keep subco.company in sync.
	let selectedCompany = $state<Company | null>(
		subco.company ? ({ id: subco.company } as Company) : null
	);
	$effect(() => {
		if (selectedCompany?.id != null) subco.company = selectedCompany.id;
	});

	$effect(() => {
		fetch(charactersEndpoint)
			.then((r) => r.json())
			.then((data: Character[]) => {
				if (Array.isArray(data)) characters = data;
			});
	});

	function addMember(id: number) {
		if (!subco.members.includes(id)) subco.members = [...subco.members, id];
		memberQuery = '';
	}

	function removeMember(id: number) {
		subco.members = subco.members.filter((m) => m !== id);
	}
</script>

<div class="form">
	<label for="subco-name">name</label>
	<input id="subco-name" type="text" bind:value={subco.name} />

	<label for="subco-company">company</label>
	<CompanySelect bind:company={selectedCompany} />

	<span class="label">Your Character</span>
	{#if subco.members.length > 0}
		<div class="member-tags">
			{#each subco.members as memberId (memberId)}
				{@const char = characters.find((c) => c.id === memberId)}
				<span class="tag">
					{char?.name ?? memberId}
					<button type="button" onclick={() => removeMember(memberId)}>×</button>
				</span>
			{/each}
		</div>
	{/if}
	<SearchSelect
		options={memberOptions}
		bind:value={memberQuery}
		placeholder="Search character..."
		onselect={(o) => addMember(Number(o.value))}
	/>


</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.member-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.tag {
		display: flex;
		align-items: center;
		gap: 4px;
		background: var(--color-bg-panel);
		border: 1px solid var(--color-border);
		padding: 2px 6px;
		font-size: 0.85em;
		color: var(--color-main-dim);
	}

	.tag button {
		background: none;
		border: none;
		color: var(--color-main-dim);
		cursor: pointer;
		padding: 0;
		font-size: 1em;
		line-height: 1;
	}

	.tag button:hover {
		color: var(--color-accent);
	}

</style>
