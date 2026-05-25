<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import EmailTemplateForm from '$lib/components/email-template-form.svelte';
	import type { EmailTemplate } from '$lib/db/email_template.repo';

	let template: EmailTemplate = $state({
		id: null,
		key: '',
		docUrl: ''
	});

	async function save() {
		const response = await fetch('/api/email-templates', {
			method: 'put',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(template)
		});
		if (response.ok) {
			await invalidate('/api/email-templates');
			await goto('.');
		}
	}
</script>

<main>
	<a href=".">back</a>
	<h1>new email template</h1>
	<EmailTemplateForm bind:template={template} />
	<div>
		<button onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
</style>
