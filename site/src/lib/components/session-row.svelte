<script lang="ts">
	let { session }: { session: SessionView } = $props();

	type SessionView = {
		token?: string;
		roles?: string[];
		start?: string;
		end?: string;
		description?: string;
	};
</script>

<td>{session.token ?? ''}</td>
<td>{session.roles?.join(', ') ?? ''}</td>
<td>{session.start ?? ''}</td>
<td>{session.end ?? ''}</td>
<td>{session.description ?? ''}</td>

<style>
	td {
		padding: 16px 8px;
	}
</style>
