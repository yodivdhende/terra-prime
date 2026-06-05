<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidate } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import mqtt from 'mqtt';
	import Dropdown from '$lib/components/dropdown.svelte';
	import { Settings2 } from '@lucide/svelte';
	import type {
		StatusCommandInfo,
		WebStatusCommandInfo
	} from '../../../../mqtt-server/connection-coordinator';
	import SessionRow from '$lib/components/session-row.svelte';
	import { type PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	const STATUS_PREFIX = 'terra/status/';

	let { data }: PageProps = $props();
	let sessionToken: string | undefined = $derived(data.sessionToken);
	// Connection list aggregated client-side from retained `terra/status/+` messages.
	let connections = new SvelteMap<string, StatusCommandInfo>();
	let client: mqtt.MqttClient | undefined;

	if (browser && sessionToken != null) {
		const token = sessionToken;
		const url = env.PUBLIC_MQTT_WS_URL ?? 'ws://localhost:9001';
		client = mqtt.connect(url, {
			// Clear our retained status if we drop ungracefully.
			will: { topic: `${STATUS_PREFIX}${token}`, payload: '', retain: true }
		});
		client.on('connect', () => {
			client?.publish(
				`${STATUS_PREFIX}${token}`,
				JSON.stringify({ sessionToken: token, connectionType: 'Web' } satisfies WebStatusCommandInfo),
				{ retain: true }
			);
			client?.subscribe(`${STATUS_PREFIX}+`);
		});
		client.on('message', (topic, payload) => {
			const statusToken = topic.slice(STATUS_PREFIX.length);
			const text = payload.toString();
			if (text === '') {
				connections.delete(statusToken);
			} else {
				connections.set(statusToken, JSON.parse(text));
			}
		});
		client.on('error', (err) => console.error('mqtt error:', err));
	}

	onDestroy(() => {
		if (!client) return;
		if (sessionToken != null) {
			client.publish(`${STATUS_PREFIX}${sessionToken}`, '', { retain: true });
		}
		client.end();
	});

	function sendCommand(command: 'virus', token: string) {
		if (command === 'virus') {
			client?.publish(`terra/goto/${token}`, JSON.stringify({ screen: 'virus' }));
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
						<SessionRow {session} connection={connections.get(session.token)} />
						<td>
							<Dropdown {button} {content} />
							{#snippet button()}
								<Settings2 />
							{/snippet}
							{#snippet content()}
								<ul class="options">
									<li><button>edit</button></li>
									<li><button onclick={() => sendCommand("virus", session.token)}>send virus</button></li>
									<li><button onclick={() => deleteConnection(session.token)}>delete</button></li>
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
