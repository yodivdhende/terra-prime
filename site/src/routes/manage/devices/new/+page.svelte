<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DeviceForm from '$lib/components/device-form.svelte';
	import type { DeviceDraft } from '$lib/types/device';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import { generateUuid } from '$lib/utils/uuid';

	let device: DeviceDraft = $state({
		id: null,
		name: '',
		uid: generateUuid(),
		roles: []
	});

	async function save() {
		const { name, uid, roles } = $state.snapshot(device);
		try {
			const response = await fetch('/api/devices', {
				method: 'put',
				body: JSON.stringify({ name, uid, roles }),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok === false) {
				TOAST_MANAGER.error(await errorMessage(response, 'Failed to save device'));
				return;
			}
			const { id } = await response.json();
			TOAST_MANAGER.success('Device saved');
			await invalidate('/api/devices');
			// Land on the edit page either way, for any further role changes.
			await goto(resolve('/manage/devices/[id]', { id: String(id) }));
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function errorMessage(response: Response, fallback: string): Promise<string> {
		try {
			const body = await response.json();
			return typeof body?.message === 'string' ? body.message : fallback;
		} catch {
			return fallback;
		}
	}
</script>

<main>
	<a href={resolve('/manage/devices')}>back</a>
	<h1>new device</h1>
	<DeviceForm bind:device />
	<div>
		<button class="btn" onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
		max-width: 400px;
	}
</style>
