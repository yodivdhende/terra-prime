<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import EmailTemplateForm from '$lib/components/email-template-form.svelte';
	import type { EmailTemplate } from '$lib/db/email_template.repo';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let template: EmailTemplate = $state({
		id: null,
		key: '',
		docUrl: ''
	});

	async function save() {
		try {
			const response = await fetch('/api/email-templates', {
				method: 'put',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(template)
			});
			if (response.ok) {
				TOAST_MANAGER.success('Email template saved');
				await invalidate('/api/email-templates');
				await goto('.');
			} else {
				TOAST_MANAGER.error(`Save failed (${response.status})`);
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err?.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href=".">back</a>
	<h1>new email template</h1>
	<EmailTemplateForm bind:template={template} />
	<div>
		<button class="btn" onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
</style>
