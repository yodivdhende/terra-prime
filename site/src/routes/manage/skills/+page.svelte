<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';
	import DataTable from '$lib/components/data-table.svelte';
	import type { Skill } from '$lib/db/skills.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();

	let skills = $state<Skill[]>([]);
	$effect(() => {
		skills = data.skills;
	});

	const columns = [
		{ label: 'Id', key: 'id' },
		{ label: 'Group', key: 'groupName' },
		{ label: 'Name', key: 'name' },
		{ label: 'Description', key: 'description' },
		{ label: 'Cost', key: 'cost' }
	];

	async function saveCosts() {
		try {
			const result = await fetch('/api/skills/bulk', {
				method: 'post',
				body: JSON.stringify($state.snapshot(skills)),
				headers: { 'content-type': 'application/json' }
			});
			if (result.ok) {
				TOAST_MANAGER.success('Costs updated');
				await invalidate('/api/skills');
			} else {
				TOAST_MANAGER.error('Failed to update costs');
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<div class="actions">
		<a href="skills/new"><CirclePlus /></a>
		<button class="btn" onclick={saveCosts}>save costs</button>
	</div>
	<DataTable items={skills} {columns}>
		{#snippet row(item)}
			{@const skill = item as (typeof skills)[0]}
			<tr>
				<td><a href="skills/{skill.id}">{skill.id}</a></td>
				<td>{skill.groupName}</td>
				<td>{skill.name}</td>
				<td>{skill.description}</td>
				<td><input type="number" min="0" bind:value={skill.cost} /></td>
			</tr>
		{/snippet}
	</DataTable>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		justify-content: end;
		align-items: end;
		gap: 8px;
		padding: 16px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	input[type='number'] {
		width: 90px;
	}
</style>
