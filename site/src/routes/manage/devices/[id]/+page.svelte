<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DeviceForm from '$lib/components/device-form.svelte';
	import type { DeviceDraft } from '$lib/types/device';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let device: DeviceDraft | null = $state(null);

	$effect(() => {
		const { device: loaded } = data;
		device = loaded
			? { id: loaded.id, name: loaded.name, uid: loaded.uid, roles: loaded.roles }
			: null;
	});

	async function save() {
		const draft = $state.snapshot(device);
		if (draft?.id == null) return;
		try {
			const response = await fetch(`/api/devices/${draft.id}`, {
				method: 'post',
				body: JSON.stringify({ name: draft.name, uid: draft.uid }),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok) {
				TOAST_MANAGER.success('Device saved');
				await goto(resolve('/manage/devices'));
			} else {
				TOAST_MANAGER.error('Failed to save device');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function remove() {
		const draft = $state.snapshot(device);
		if (draft?.id == null) return;
		try {
			const response = await fetch(`/api/devices/${draft.id}`, { method: 'delete' });
			if (response.ok) {
				TOAST_MANAGER.success('Device deleted');
				await goto(resolve('/manage/devices'));
			} else {
				TOAST_MANAGER.error('Failed to delete device');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/devices')}>back</a>
	{#if device != null}
		<DeviceForm bind:device />
	{:else}
		<p>Device not found.</p>
	{/if}
	<div class="actions">
		<button class="btn" onclick={save}>save</button>
		<button class="btn btn-danger" onclick={remove}>delete</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
	}

	.actions {
		display: flex;
		gap: 8px;
	}
</style>
