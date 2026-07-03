<script lang="ts">
	import { apiDocSections, type ApiMethod } from '$lib/data/api-docs';

	function renderInline(text: string): string {
		const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
	}

	const methodClass: Record<ApiMethod, string> = {
		GET: 'method-get',
		POST: 'method-post',
		PUT: 'method-put',
		PATCH: 'method-put',
		DELETE: 'method-delete'
	};
</script>

<main>
	<h1>API Reference</h1>
	<p class="intro">
		All handlers use <code>handleRequest()</code> for error handling and extract tokens via
		<code>getSessionToken(cookies)</code> or the <code>authentication</code> header. Numeric path
		params are validated via <code>isNumberOrError(param)</code>. Responses are JSON unless noted
		(file streams, HTML, <code>204 No Content</code>).
	</p>

	{#each apiDocSections as section}
		<section>
			<h2>{section.title}</h2>
			{#if section.note}
				<p class="note">{@html renderInline(section.note)}</p>
			{/if}
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th>Method</th>
							<th>Path</th>
							<th>Auth</th>
							<th>Returns</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						{#each section.endpoints as endpoint}
							<tr>
								<td><span class="method {methodClass[endpoint.method]}">{endpoint.method}</span></td>
								<td class="path">{endpoint.path}</td>
								<td>{endpoint.auth}</td>
								<td>{@html renderInline(endpoint.returns)}</td>
								<td>{@html renderInline(endpoint.description)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/each}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px 24px 48px;
		font-family: var(--font-mono);
		color: var(--color-main);
	}

	h1 {
		color: var(--color-accent);
		letter-spacing: 0.05em;
	}

	.intro {
		color: var(--color-main-dim);
		max-width: 70ch;
		margin-bottom: 1.5em;
	}

	section {
		margin-bottom: 2.5em;
	}

	h2 {
		color: var(--color-accent);
		border-bottom: 1px solid var(--border-color-dim);
		padding-bottom: 4px;
		margin-bottom: 0.5em;
	}

	.note {
		color: var(--color-main-dim);
		max-width: 90ch;
		margin: 0 0 0.75em;
	}

	.table-wrapper {
		width: 100%;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-mono);
		color: var(--color-main);
	}

	thead tr {
		border-bottom: var(--border-width) solid var(--color-accent);
	}

	th {
		padding: 8px;
		text-align: left;
		white-space: nowrap;
		color: var(--color-accent);
		font-weight: bold;
		letter-spacing: 0.05em;
	}

	tbody tr {
		border-bottom: 1px solid var(--border-color-dim);
	}

	td {
		padding: 12px 8px;
		vertical-align: top;
	}

	td.path {
		white-space: nowrap;
		font-weight: bold;
	}

	.method {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: bold;
		font-size: 0.85em;
		border: 1px solid currentcolor;
		white-space: nowrap;
	}

	.method-get {
		color: var(--color-accent);
	}

	.method-post,
	.method-put {
		color: var(--color-main);
	}

	.method-delete {
		color: var(--color-warning);
	}

	:global(main td code),
	:global(main p code) {
		font-family: var(--font-mono);
		background: rgba(255, 255, 255, 0.08);
		padding: 1px 4px;
		border-radius: 3px;
	}
</style>
