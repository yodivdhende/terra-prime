<script lang="ts">
	import { DEVICE_ROLE_NAMES } from '$lib/types/device';
	import type { DeviceDraft, DeviceRole, DeviceRoleName, DeviceSummary } from '$lib/types/device';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';
	import { isWebSerialSupported, programUid } from '$lib/utils/web-serial';

	let { device = $bindable<DeviceDraft>() }: { device: DeviceDraft } = $props();

	type CharacterVersionOption = {
		id: number;
		name: string;
		characterName: string;
		ownerName: string;
	};

	const ROLE_LABELS: Record<DeviceRoleName, string> = {
		port: 'Port',
		aguesguard: 'AguesGuard',
		game: 'Game',
		printer: 'Printer',
		light: 'Light'
	};

	let characterVersions: CharacterVersionOption[] = $state([]);
	let ports: DeviceSummary[] = $state([]);
	let programming = $state(false);
	const webSerial = isWebSerialSupported();

	/**
	 * Roles are their own sub-resource, so a checkbox on an unsaved device has nothing to POST to.
	 * Editing them waits until the device exists.
	 */
	const saved = $derived(device.id != null);

	$effect(() => {
		loadPickers();
	});

	function roleOf(name: DeviceRoleName): DeviceRole | undefined {
		return device.roles.find((role) => role.role === name);
	}

	async function loadPickers() {
		const [versionResponse, portResponse] = await Promise.all([
			fetch('/api/characters/versions'),
			fetch('/api/devices/ports')
		]);
		if (versionResponse.ok) characterVersions = await versionResponse.json();
		if (portResponse.ok) ports = await portResponse.json();
	}

	async function toggleRole(name: DeviceRoleName, attach: boolean) {
		if (attach === false) {
			await detachRole(name);
			return;
		}
		// Sensible starting values; the revealed fields then edit the role in place.
		switch (name) {
			case 'port':
				await attachRole(name, {});
				break;
			case 'aguesguard': {
				const characterVersionId = characterVersions[0]?.id;
				if (characterVersionId == null) {
					TOAST_MANAGER.warning('There are no character versions to load onto an AguesGuard');
					return;
				}
				await attachRole(name, { characterVersionId });
				break;
			}
			case 'game': {
				const portDeviceId = ports.find(({ id }) => id !== device.id)?.id;
				if (portDeviceId == null) {
					TOAST_MANAGER.warning('Register a port before making a device a game');
					return;
				}
				await attachRole(name, { portDeviceId });
				break;
			}
			case 'printer':
				await attachRole(name, { printsAvailable: 0 });
				break;
			case 'light':
				await attachRole(name, { endpoint: '', fixture: '' });
				break;
		}
	}

	async function attachRole(name: DeviceRoleName, body: Record<string, unknown>) {
		const { id } = device;
		if (id == null) return;
		try {
			const response = await fetch(`/api/devices/${id}/roles/${name}`, {
				method: 'post',
				body: JSON.stringify(body),
				headers: { 'content-type': 'application/json' }
			});
			if (response.ok === false) {
				TOAST_MANAGER.error(await errorMessage(response, `Failed to set the ${name} role`));
				return;
			}
			device.roles = (await response.json()).roles ?? [];
			if (name === 'port') await loadPickers();
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function detachRole(name: DeviceRoleName) {
		const { id } = device;
		if (id == null) return;
		try {
			const response = await fetch(`/api/devices/${id}/roles/${name}`, { method: 'delete' });
			if (response.ok === false) {
				TOAST_MANAGER.error(await errorMessage(response, `Failed to remove the ${name} role`));
				return;
			}
			device.roles = (await response.json()).roles ?? [];
			if (name === 'port') await loadPickers();
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	async function program() {
		programming = true;
		try {
			const result = await programUid(device.uid);
			if (result.ok) TOAST_MANAGER.success('Uid written to the board');
			else TOAST_MANAGER.error(result.error);
		} finally {
			programming = false;
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
	<label for="device-name">name</label>
	<input id="device-name" type="text" bind:value={device.name} />

	<label for="device-uid">uid</label>
	<div class="uid-row">
		<input id="device-uid" type="text" bind:value={device.uid} />
		{#if webSerial}
			<button class="btn" type="button" onclick={program} disabled={programming}>
				{programming ? 'programming…' : 'program via USB'}
			</button>
		{/if}
	</div>
	{#if webSerial === false}
		<p class="hint">
			Programming over USB needs Web Serial — use desktop Chrome or Edge, or transcribe the uid off
			the hardware by hand.
		</p>
	{/if}

	<fieldset>
		<legend>Roles</legend>
		<p class="hint">
			A device is whatever its roles say it is, and it may hold several. A device with no roles is
			unclassified, which is fine. A port carries no behaviour of its own — what happens when an
			AguesGuard docks with it is decided by whoever listens for the event.
		</p>
		{#if saved === false}
			<p class="hint">Roles can be attached once the device is saved.</p>
		{:else}
			{#each DEVICE_ROLE_NAMES as name (name)}
				{@const role = roleOf(name)}
				<div class="role">
					<label class="role-toggle">
						<input
							type="checkbox"
							checked={role != null}
							onchange={(event) => toggleRole(name, event.currentTarget.checked)}
						/>
						{ROLE_LABELS[name]}
					</label>

					{#if role?.role === 'aguesguard'}
						<div class="role-fields">
							<label for="device-character-version">character version</label>
							<select
								id="device-character-version"
								value={role.characterVersionId}
								onchange={(event) =>
									attachRole('aguesguard', {
										characterVersionId: Number(event.currentTarget.value)
									})}
							>
								{#each characterVersions as version (version.id)}
									<option value={version.id}>
										{version.characterName} — {version.name} ({version.ownerName})
									</option>
								{/each}
							</select>
						</div>
					{:else if role?.role === 'game'}
						<div class="role-fields">
							<label for="device-port">port</label>
							<select
								id="device-port"
								value={role.portDeviceId}
								onchange={(event) =>
									attachRole('game', { portDeviceId: Number(event.currentTarget.value) })}
							>
								{#each ports.filter(({ id }) => id !== device.id) as port (port.id)}
									<option value={port.id}>{port.name} ({port.uid})</option>
								{/each}
							</select>
						</div>
					{:else if role?.role === 'printer'}
						<div class="role-fields">
							<label for="device-prints-available">prints available</label>
							<input
								id="device-prints-available"
								type="number"
								min="0"
								value={role.printsAvailable}
								onchange={(event) =>
									attachRole('printer', { printsAvailable: Number(event.currentTarget.value) })}
							/>
						</div>
					{:else if role?.role === 'light'}
						<div class="role-fields">
							<label for="device-endpoint">endpoint</label>
							<input
								id="device-endpoint"
								type="text"
								value={role.endpoint}
								onchange={(event) =>
									attachRole('light', {
										endpoint: event.currentTarget.value,
										fixture: role.fixture
									})}
							/>
							<label for="device-fixture">fixture</label>
							<input
								id="device-fixture"
								type="text"
								value={role.fixture}
								onchange={(event) =>
									attachRole('light', {
										endpoint: role.endpoint,
										fixture: event.currentTarget.value
									})}
							/>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</fieldset>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.uid-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.uid-row input {
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

	.role {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.role-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.role-fields {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-left: 24px;
	}
</style>
