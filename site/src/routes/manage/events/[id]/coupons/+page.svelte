<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SearchSelect from '$lib/components/search-select.svelte';
	import DataTable from '$lib/components/data-table.svelte';
	import type { User } from '$lib/db/user.repo';
	import type { EventCoupon } from '$lib/db/event_coupon.repo';
	import { CirclePlus } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	const columns = [
		{ label: 'Player', key: 'userName' },
		{ label: 'Code', key: 'code' },
		{ label: 'Extra Budget', key: 'value' },
		{ label: 'Redeemed', key: 'redeemed' },
		{ label: '', key: '' }
	];

	const allUsers = $derived<User[]>(data.allUsers ?? []);
	const coupons = $derived<EventCoupon[]>(data.coupons ?? []);

	const userOptions = $derived(
		allUsers.map((u) => ({ label: `${u.name} (${u.email})`, value: String(u.id) }))
	);

	type Draft = { key: number; userId: number | null; value: number };
	let drafts = $state<Draft[]>([]);
	let nextKey = 0;

	function addDraft() {
		drafts = [...drafts, { key: nextKey++, userId: null, value: 0 }];
	}

	function removeDraft(key: number) {
		drafts = drafts.filter((d) => d.key !== key);
	}

	async function saveDraft(draft: Draft) {
		if (draft.userId == null) return;
		try {
			const res = await fetch(`/api/events/${data.eventId}/coupons`, {
				method: 'post',
				body: JSON.stringify({ userId: draft.userId, value: draft.value }),
				headers: { 'content-type': 'application/json' }
			});
			const { code } = await res.json();
			TOAST_MANAGER.success(`Coupon saved — code: ${code}`);
			removeDraft(draft.key);
			await invalidateAll();
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}

	async function deleteCoupon(couponId: number) {
		try {
			await fetch(`/api/events/${data.eventId}/coupons/${couponId}`, { method: 'delete' });
			TOAST_MANAGER.success('Coupon deleted');
			await invalidateAll();
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href="..">back</a>
	<h2>Event Coupons</h2>

	{#if data.couponsEnabled}
		<button class="btn add" onclick={addDraft} aria-label="Add coupon">
			<CirclePlus />
		</button>
	{/if}

	{#if drafts.length > 0}
		<table class="drafts">
			<tbody>
				{#each drafts as draft (draft.key)}
					<tr>
						<td colspan="2">
							<SearchSelect
								options={userOptions}
								placeholder="Search player..."
								onselect={(o) => (draft.userId = Number(o.value))}
							/>
						</td>
						<td>
							<input
								type="number"
								min="0"
								bind:value={draft.value}
								disabled={draft.userId == null}
							/>
						</td>
						<td></td>
						<td>
							<button class="btn" onclick={() => saveDraft(draft)} disabled={draft.userId == null}>
								save
							</button>
							<button class="btn" onclick={() => removeDraft(draft.key)}>cancel</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	{#if coupons.length === 0 && drafts.length === 0}
		<p>No coupons for this event.</p>
	{:else if coupons.length > 0}
		<DataTable items={coupons} {columns}>
			{#snippet row(item)}
				{@const coupon = item as EventCoupon}
				<tr>
					<td>{coupon.userName}</td>
					<td class="code">{coupon.code}</td>
					<td>{coupon.value}</td>
					<td>{coupon.redeemed ? 'yes' : 'no'}</td>
					<td><button class="btn" onclick={() => deleteCoupon(coupon.id)}>delete</button></td>
				</tr>
			{/snippet}
		</DataTable>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 16px;
		gap: 12px;
	}
	.add {
		align-self: flex-start;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-accent);
	}
	table.drafts {
		border-collapse: collapse;
		width: 100%;
	}
	td {
		padding: 6px 10px;
		border-bottom: 1px solid silver;
		text-align: left;
	}
	.code {
		font-family: var(--font-mono);
		opacity: 0.8;
	}
	input[type='number'] {
		width: 90px;
	}
</style>
