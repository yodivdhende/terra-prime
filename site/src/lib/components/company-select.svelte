<script lang="ts">
	import type { Company } from '$lib/db/companies.repo';

	let {
		value = $bindable<number | null>(null),
		name = $bindable<string | null>(null)
	}: { value: number | null; name?: string | null } = $props();

	let companies = $state<Company[]>([]);

	$effect(() => {
		fetch('/api/companies')
			.then((r) => r.json())
			.then((data) => (companies = data));
	});

	$effect(() => {
		name = companies.find((c) => c.id === value)?.name ?? null;
	});
</script>

<select bind:value>
	<option value={null}>— select a company —</option>
	{#each companies as company}
		<option value={company.id}>{company.name}</option>
	{/each}
</select>

<style>
	select {
		font-family: var(--font-mono);
		font-size: 0.85rem;
		background: black;
		color: var(--color-main);
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
		padding: 0.2rem 0;
		outline: none;
		width: 100%;
		appearance: none;
	}

	select:focus {
		border-bottom-color: var(--color-accent);
	}
</style>
