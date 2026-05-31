<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import CompanyForm from '$lib/components/company-form.svelte';
	import type { Company } from '$lib/db/companies.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let company: Company = $state({
		id: null,
		name: '',
		description: '',
		link: null
	});

	async function save() {
		try {
			const response = await fetch('/api/companies', {
				method: 'put',
				body: JSON.stringify($state.snapshot(company)),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok) {
				TOAST_MANAGER.success('Company created');
				await invalidate('/api/companies');
				await goto('.');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href=".">back</a>
	<h1>new company</h1>
	<CompanyForm bind:company />
	<div>
		<button onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		gap: 8px;
	}
</style>
