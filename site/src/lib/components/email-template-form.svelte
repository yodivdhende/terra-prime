<script lang="ts">
	import { type EmailTemplate } from '$lib/db/email_template.repo';
	import { ExternalLink } from '@lucide/svelte';

	let {
		template = $bindable<EmailTemplate>(),
		isExisting = false
	}: { template: EmailTemplate; isExisting?: boolean } = $props();

	const KNOWN_SUBJECTS: Record<string, string> = {
		verify_email: 'Verify your Terra Prime email',
		password_reset: 'Reset your Terra Prime password'
	};

	const resolvedSubject = $derived(KNOWN_SUBJECTS[template.key]);
</script>

<main>
	<label for="key">key</label>
	<input
		id="key"
		type="text"
		bind:value={template.key}
		disabled={isExisting}
		placeholder="e.g. verify_email"
	/>

	<label for="docUrl">doc url</label>
	<div class="row">
		<input id="docUrl" type="url" bind:value={template.docUrl} placeholder="https://docs.google.com/document/d/..." />
		{#if template.docUrl}
			<a href={template.docUrl} target="_blank" rel="noopener noreferrer external" title="open doc in new tab">
				<ExternalLink size={16} />
			</a>
		{/if}
	</div>

	{#if resolvedSubject != null}
		<p class="hint">subject (hardcoded): <em>{resolvedSubject}</em></p>
	{:else if template.key}
		<p class="hint warn">no hardcoded subject for this key — add one to email.service.ts SUBJECTS map before this template can be sent</p>
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.row input {
		flex: 1;
	}
	a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: inherit;
		text-decoration: none;
		padding: 4px;
	}
	.hint {
		font-size: 0.85em;
		opacity: 0.7;
		margin: 0;
	}
	.hint.warn {
		color: orange;
		opacity: 1;
	}
</style>
