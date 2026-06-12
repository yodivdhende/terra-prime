<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidate } from '$app/navigation';
	import Dropdown from '$lib/components/dropdown.svelte';
	import { Settings2 } from '@lucide/svelte';
	import type {
		ConnectionCommand,
		StatusCommandInfo,
		WebStatusCommandInfo
	} from '../../../../../websocket-server/connection-socket';
	import SessionRow from '$lib/components/session-row.svelte';
	import { type PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let sessionToken: string | undefined = $derived(data.sessionToken);
	let connections: StatusCommandInfo[] = $state([]);
	let webSocket: WebSocket | undefined;

	if (browser) {
		webSocket = new WebSocket('ws://localhost:5173/connections');
		webSocket.onopen = () => {
			if (sessionToken != null) {
				webSocket?.send(
					JSON.stringify({status: { sessionToken: sessionToken, connectionType: 'Web' } as WebStatusCommandInfo})
				);
			}
			webSocket!.onmessage = (event) => {
				console.log('socket message:', event.data);
				connections = JSON.parse(event.data);
			};
		};
	}

	function sendCommand(command: "virus", token: string) {
		if (command === "virus") {
			webSocket?.send(
				JSON.stringify({
					goTo: { targetToken: token, screen: 'virus'}, 
				} as ConnectionCommand 
			));
		}
	}

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
			invalidate('/api/sessions');
		} catch (err: any) {
			TOAST_MANAGER.error(err?.message ?? 'Something went wrong');
		}
	}


</script>

<main>
	<a href="sessions/new">+ add</a>
	<table>
		<thead>
			<tr>
				<th>Token</th>
				<th>Connection</th>
				<th>Roles</th>
				<th>Start</th>
				<th>End</th>
				<th>Description</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#if data.sessions}
				{#each data.sessions as session}
					<tr>
						<SessionRow
							{session}
							connection={connections.find(
								(connection) => connection.sessionToken === session.token
							)}
						/>
						<td>
							<Dropdown {button} {content} />
							{#snippet button()}
								<Settings2 />
							{/snippet}
							{#snippet content()}
								<ul class="options">
									<li><button class="btn">edit</button></li>
									<li><button class="btn" onclick={() => sendCommand("virus", session.token)}>send virus</button></li>
									<li><button class="btn" onclick={() => deleteConnection(session.token)}>delete</button></li>
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
