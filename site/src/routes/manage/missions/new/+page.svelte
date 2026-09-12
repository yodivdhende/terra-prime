<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import MissionForm from '$lib/components/mission-form.svelte';
	import type { MissionDraft } from '$lib/db/mission.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let mission: MissionDraft = $state({
		id: null,
		name: '',
		playerLimit: 0
	});

	async function save() {
		const { name, playerLimit } = $state.snapshot(mission);
		try {
			const response = await fetch('/api/missions', {
				method: 'put',
				body: JSON.stringify({ name, playerLimit }),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok === false) {
				TOAST_MANAGER.error('Failed to save mission');
				return;
			}
			const { id } = await response.json();
			TOAST_MANAGER.success('Mission saved');
			await invalidate('/api/missions');
			// Straight to the edit page: printers can only be attached once the
			// mission exists.
			await goto(resolve('/manage/missions/[id]', { id: String(id) }));
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/missions')}>back</a>
	<h1>new mission</h1>
	<MissionForm bind:mission />
	<div>
		<button class="btn" onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
</style>
