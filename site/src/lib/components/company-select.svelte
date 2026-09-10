<script lang="ts">
	import type { Company } from '$lib/db/companies.repo';

	let {
		company = $bindable<Company | null>(null)
	}: { company?: Company | null } = $props();

	let companies = $state<Company[]>([]);
	let selectedId = $state<number | null>(company?.id ?? null);

	$effect(() => {
		fetch('/api/companies')
			.then((r) => r.json())
			.then((data: Company[]) => {
				companies = data;
				selectedId = company?.id ?? null;
				if (selectedId === null && data.length > 0) {
					selectedId = data[0].id;
				}
			});
	});

	$effect(() => {
		if (companies.length > 0) {
			company = companies.find((c) => c.id === selectedId) ?? null;
		}
	});
</script>

<select bind:value={selectedId} required>
	{#each companies as c (c.id)}
		<option value={c.id}>{c.name}</option>
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
