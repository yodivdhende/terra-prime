<script lang="ts">
	import type { MissionDraft, MissionPrinter } from '$lib/db/mission.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { mission = $bindable<MissionDraft>() }: { mission: MissionDraft } = $props();

	let attached: MissionPrinter[] = $state([]);
	let available: MissionPrinter[] = $state([]);
	let selectedDeviceId: number | null = $state(null);

	/** Never stored: the mission has as many prints as its printers hold. */
	const availablePrints = $derived(
		attached.reduce((total, { printsAvailable }) => total + printsAvailable, 0)
	);

	$effect(() => {
		const { id } = mission;
		if (id == null) return;
		loadPrinters(id);
	});

	async function loadPrinters(id: number) {
		try {
			const response = await fetch(`/api/missions/${id}/printers`);
			if (response.ok === false) {
				TOAST_MANAGER.error('Failed to load printers');
				return;
			}
			const body = await response.json();
			attached = body.attached ?? [];
			available = body.available ?? [];
			selectedDeviceId = available[0]?.deviceId ?? null;
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function generateName() {
		try {
			const response = await fetch('/api/missions/generate-name');
			if (response.ok === false) {
				TOAST_MANAGER.error('Failed to generate a name');
				return;
			}
			const { name } = await response.json();
			if (typeof name === 'string') mission.name = name;
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function changePrinter(method: 'post' | 'delete', deviceId: number) {
		const { id } = mission;
		if (id == null) return;
		try {
			const response = await fetch(`/api/missions/${id}/printers`, {
				method,
				body: JSON.stringify({ deviceId }),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok === false) {
				TOAST_MANAGER.error(
					method === 'post' ? 'Failed to attach printer' : 'Failed to detach printer'
				);
				return;
			}
			await loadPrinters(id);
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<label for="mission-name">name</label>
	<div class="name-row">
		<input id="mission-name" type="text" bind:value={mission.name} />
		<button class="btn" type="button" onclick={generateName}>generate</button>
	</div>

	<label for="mission-player-limit">player limit</label>
	<input id="mission-player-limit" type="number" min="0" bind:value={mission.playerLimit} />

	{#if mission.id == null}
		<p class="hint">Printers can be attached once the mission is saved.</p>
	{:else}
		<fieldset>
			<legend>Printers</legend>
			<p class="hint">
				A mission has no print pool of its own. Its available prints are the sum of the printers
				attached to it — wheel one in or out to change the number.
			</p>
			{#if attached.length === 0}
				<p class="hint">No printers attached.</p>
			{:else}
				<table>
					<thead>
						<tr>
							<th>Printer</th>
							<th>Uid</th>
							<th>Prints available</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each attached as printer (printer.deviceId)}
							<tr>
								<td>{printer.name}</td>
								<td>{printer.uid}</td>
								<td>{printer.printsAvailable}</td>
								<td>
									<button
										class="btn btn-danger"
										type="button"
										onclick={() => changePrinter('delete', printer.deviceId)}>detach</button
									>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td colspan="2">total</td>
							<td>{availablePrints}</td>
							<td></td>
						</tr>
					</tfoot>
				</table>
			{/if}
			{#if available.length > 0}
				<div class="attach-row">
					<select bind:value={selectedDeviceId} aria-label="Printer to attach">
						{#each available as printer (printer.deviceId)}
							<option value={printer.deviceId}>{printer.name} ({printer.printsAvailable})</option>
						{/each}
					</select>
					<button
						class="btn"
						type="button"
						disabled={selectedDeviceId == null}
						onclick={() => selectedDeviceId != null && changePrinter('post', selectedDeviceId)}
						>attach</button
					>
				</div>
			{:else}
				<p class="hint">No unattached printers available.</p>
			{/if}
		</fieldset>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.name-row,
	.attach-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.name-row input {
		flex: 1;
	}

	fieldset {
		border: 1px solid var(--color-border, #444);
		border-radius: 4px;
		padding: 8px 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	legend {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
		padding: 0 4px;
	}

	.hint {
		margin: 0;
		font-size: 0.8rem;
		opacity: 0.6;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		text-align: left;
		padding: 4px 8px;
	}

	tfoot td {
		border-top: 1px solid var(--border-color-dim, rgba(255, 255, 255, 0.2));
		font-weight: bold;
	}
</style>
