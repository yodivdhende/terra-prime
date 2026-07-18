<script lang="ts">
	import type { Subco } from '$lib/db/subco.repo';
	import type { Company } from '$lib/db/companies.repo';
	import CompanySelect from '$lib/components/company-select.svelte';
	import SubcoMemberSelect from '$lib/components/subco-member-select.svelte';

	let {
		subco = $bindable<Subco>(),
		charactersEndpoint = '/api/characters',
		nameEditable = true
	}: {
		subco: Subco;
		charactersEndpoint?: string;
		nameEditable?: boolean;
	} = $props();

	$inspect(subco);

	// company-select binds a whole Company object; keep subco.company in sync.
	let selectedCompany = $state<Company | null>(
		subco.company ? ({ id: subco.company } as Company) : null
	);
	$effect(() => {
		if (selectedCompany?.id != null) subco.company = selectedCompany.id;
	});
</script>

<div class="form">
	<label for="subco-name">name</label>
	<input id="subco-name" type="text" bind:value={subco.name} disabled={!nameEditable} />
	{#if !nameEditable}
		<span class="hint">only the subco owner can rename it</span>
	{/if}

	<label for="subco-company">company</label>
	<CompanySelect bind:company={selectedCompany} />

	<span class="label">Members</span>
	<SubcoMemberSelect bind:members={subco.members} {charactersEndpoint} />
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.hint {
		font-size: 0.8em;
		color: var(--color-main-dim);
		margin-top: -6px;
	}
</style>
