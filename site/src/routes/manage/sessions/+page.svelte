<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Dropdown from '$lib/components/dropdown.svelte';
	import { Settings2 } from '@lucide/svelte';
	import SessionRow from '$lib/components/session-row.svelte';
	import { type PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	/**
	 * No realtime here any more. This page used to open a socket to the relay and render a
	 * connection icon per session token, which only worked because a device's identity *was* a
	 * hand-copied session token. Devices are their own registry now and announce themselves by UID
	 * over MQTT, so live status and the commands that go with it live on `manage/devices` — where
	 * the UIDs are — and this page is back to being about auth sessions.
	 */
	let { data }: PageProps = $props();

	async function deleteConnection(token: string) {
		try {
			const response = await fetch(`/api/sessions/${token}`, {
				method: 'DELETE'
			});
			if (response.ok) {
				TOAST_MANAGER.success('Session removed');
			} else {
				TOAST_MANAGER.error(`Delete failed (${response.status})`);
			}
			await invalidateAll();
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}
</script>

<main>
	<a href={resolve('/manage/sessions/new')}>+ add</a>
	<table>
		<thead>
			<tr>
				<th>Token</th>
				<th>Roles</th>
				<th>Start</th>
				<th>End</th>
				<th>Description</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#if data.sessions}
				{#each data.sessions as session (session.token)}
					<tr>
						<SessionRow {session} />
						<td>
							<Dropdown {button} {content} />
							{#snippet button()}
								<Settings2 />
							{/snippet}
							{#snippet content()}
								<ul class="options">
									<li><button class="btn">edit</button></li>
									<li>
										<button class="btn btn-danger" onclick={() => deleteConnection(session.token)}
											>delete</button
										>
									</li>
								</ul>
							{/snippet}
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</main>

<style>
	main {
		padding: 16px;
	}
	table {
		max-width: 90vw;
	}
	tr {
		border-bottom: 1px solid silver;
	}

	.options li {
		margin-top: 1em;
	}
	.options li:first-child {
		margin-top: 0;
	}
</style>
