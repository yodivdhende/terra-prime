<script lang="ts">
	import { EthernetPort, Wifi } from '@lucide/svelte';
	import { type StatusCommandInfo } from '../../../mqtt-server/connection-coordinator';

	let { session, connection }: { session: SessionView; connection?: StatusCommandInfo } = $props();

	type SessionView = {
		token?: string;
		roles?: string[];
		start?: string;
		end?: string;
		description?: string;
	};
</script>

	<td>{session.token ?? ''}</td>
	<td>
		{#if connection}
			{#if connection.connectionType === 'Web'}
				<EthernetPort />
			{/if}
			{#if connection.connectionType === 'CYD'}
				<Wifi />
			{/if}
		{/if}
	</td>
	<td>{session.roles?.join(', ') ?? ''}</td>
	<td>{session.start ?? ''}</td>
	<td>{session.end ?? ''}</td>
	<td>{session.description ?? ''}</td>

<style>
	td {
		padding: 16px 8px;
	}
</style>
