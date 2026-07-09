<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CompanyForm from '$lib/components/company-form.svelte';
	import ConfirmModal from '$lib/components/confirm-modal.svelte';
	import type { Company } from '$lib/db/companies.repo';
	import type { CompanyDiscounts } from '$lib/db/company_discounts.repo';
	import type { Item } from '$lib/db/items.repo';
	import type { Implant } from '$lib/db/implants.repo';
	import type { Expertise } from '$lib/db/expertise.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let modal: ConfirmModal;
	let company: Company = $state({ id: null, name: '', description: '', link: null });
	let discounts: CompanyDiscounts = $state({ items: [], implants: [], expertise: [] });
	let items: Item[] = $state([]);
	let implants: Implant[] = $state([]);
	let expertise: Expertise[] = $state([]);

	$effect(() => {
		company = { ...data.company };
		discounts = {
			items: data.discounts?.items ?? [],
			implants: data.discounts?.implants ?? [],
			expertise: data.discounts?.expertise ?? []
		};
		items = data.items ?? [];
		implants = data.implants ?? [];
		expertise = data.expertise ?? [];
	});

	async function saveCompany() {
		const snap = $state.snapshot(company);
		if (snap.id == null) return;
		try {
			const result = await fetch(`/api/companies/${snap.id}`, {
				method: 'post',
				body: JSON.stringify(snap),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Company saved');
				await goto(resolve('/manage/companies'));
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function removeCompany() {
		const snap = $state.snapshot(company);
		if (snap.id == null) return;
		try {
			const result = await fetch(`/api/companies/${snap.id}`, { method: 'delete' });
			if (result.ok) {
				TOAST_MANAGER.success('Company deleted');
				await goto(resolve('/manage/companies'));
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function saveDiscounts() {
		const snap = $state.snapshot(company);
		if (snap.id == null) return;
		try {
			await fetch(`/api/companies/${snap.id}/discounts`, {
				method: 'post',
				body: JSON.stringify($state.snapshot(discounts)),
				headers: { 'content-type': 'application/json' }
			});
			TOAST_MANAGER.success('Discounts saved');
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	function addItemDiscount() {
		discounts.items = [...discounts.items, { itemId: items[0]?.id ?? 0, discount: 0 }];
	}
	function removeItemDiscount(index: number) {
		discounts.items = discounts.items.filter((_, i) => i !== index);
	}

	function addImplantDiscount() {
		discounts.implants = [...discounts.implants, { implantId: implants[0]?.id ?? 0, discount: 0 }];
	}
	function removeImplantDiscount(index: number) {
		discounts.implants = discounts.implants.filter((_, i) => i !== index);
	}

	function addExpertiseDiscount() {
		discounts.expertise = [...discounts.expertise, { expertiseId: expertise[0]?.id ?? 0, discount: 0 }];
	}
	function removeExpertiseDiscount(index: number) {
		discounts.expertise = discounts.expertise.filter((_, i) => i !== index);
	}
</script>

<main>
	<a href={resolve('/manage/companies')}>back</a>

	<div class="columns">
		<section class="info">
			<h2>Company</h2>
			<CompanyForm bind:company />
			<div class="actions">
				<button class="btn" onclick={saveCompany}>save</button>
				<button class="btn btn-danger" onclick={() => modal.open()}>delete</button>
			</div>
		</section>

		<section class="discounts">
			<h2>Discounts</h2>

		<h3>Items</h3>
		<table>
			<thead>
				<tr><th>Item</th><th>Discount</th><th></th></tr>
			</thead>
			<tbody>
				{#each discounts.items as row, i (i)}
					<tr>
						<td>
							<select bind:value={row.itemId}>
								{#each items as item (item.id)}
									<option value={item.id}>{item.name}</option>
								{/each}
							</select>
						</td>
						<td><input type="number" bind:value={row.discount} min="0" /></td>
						<td><button class="btn" onclick={() => removeItemDiscount(i)}>remove</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
		<button class="btn" onclick={addItemDiscount}>+ add item discount</button>

		<h3>Implants</h3>
		<table>
			<thead>
				<tr><th>Implant</th><th>Discount</th><th></th></tr>
			</thead>
			<tbody>
				{#each discounts.implants as row, i (i)}
					<tr>
						<td>
							<select bind:value={row.implantId}>
								{#each implants as implant (implant.id)}
									<option value={implant.id}>{implant.name}</option>
								{/each}
							</select>
						</td>
						<td><input type="number" bind:value={row.discount} min="0" /></td>
						<td><button class="btn" onclick={() => removeImplantDiscount(i)}>remove</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
		<button class="btn" onclick={addImplantDiscount}>+ add implant discount</button>

		<h3>Expertise</h3>
		<table>
			<thead>
				<tr><th>Expertise</th><th>Discount</th><th></th></tr>
			</thead>
			<tbody>
				{#each discounts.expertise as row, i (i)}
					<tr>
						<td>
							<select bind:value={row.expertiseId}>
								{#each expertise as entry (entry.id)}
									<option value={entry.id}>{entry.name}</option>
								{/each}
							</select>
						</td>
						<td><input type="number" bind:value={row.discount} min="0" /></td>
						<td><button class="btn" onclick={() => removeExpertiseDiscount(i)}>remove</button></td>
					</tr>
				{/each}
			</tbody>
		</table>
		<button class="btn" onclick={addExpertiseDiscount}>+ add expertise discount</button>

		<div class="actions">
			<button class="btn" onclick={saveDiscounts}>save discounts</button>
		</div>
	</section>
	</div>
</main>

<ConfirmModal bind:this={modal} message="Delete this company?" onconfirm={removeCompany} oncancel={() => modal.close()} />

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		gap: 16px;
	}
	.columns {
		display: flex;
		flex-direction: row;
		gap: 24px;
		align-items: flex-start;
		flex-wrap: wrap;
	}
	section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.info {
		flex: 0 0 320px;
	}
	.discounts {
		flex: 1 1 480px;
	}
	table {
		border-collapse: collapse;
	}
	th, td {
		padding: 6px 8px;
		border-bottom: 1px solid silver;
	}
	.actions {
		display: flex;
		gap: 8px;
	}
	input[type='number'] {
		width: 80px;
	}
</style>
