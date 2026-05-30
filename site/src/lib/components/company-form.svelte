<script lang="ts">
	import type { Company } from '$lib/db/companies.repo';

	let { company = $bindable<Company>() }: { company: Company } = $props();
</script>

<div class="form">
	<label for="name">name</label>
	<input id="name" type="text" bind:value={company.name} />
	<label for="description">description</label>
	<textarea id="description" bind:value={company.description}></textarea>
	<label for="link">link</label>
	<input id="link" type="text" bind:value={company.link} placeholder="optional" />
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
