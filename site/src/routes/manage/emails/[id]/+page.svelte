<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import EmailTemplateForm from '$lib/components/email-template-form.svelte';
	import type { EmailTemplate } from '$lib/db/email_template.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let template: EmailTemplate | null = $state(null);
	$effect(() => {
		template = data.template;
	});

	async function save() {
		const snap = $state.snapshot(template);
		if (snap == null || snap.id == null) return;
		try {
			const res = await fetch(`/api/email-templates/${snap.id}`, {
				method: 'post',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(snap)
			});
			if (res.ok) {
				TOAST_MANAGER.success('Email template saved');
				await invalidate('/api/email-templates');
				await goto('.');
			} else {
				TOAST_MANAGER.error(`Save failed (${res.status})`);
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err?.message ?? 'Something went wrong');
		}
	}

	async function remove() {
		const snap = $state.snapshot(template);
		if (snap == null || snap.id == null) return;
		try {
			const res = await fetch(`/api/email-templates/${snap.id}`, {
				method: 'delete'
			});
			if (res.ok) {
				TOAST_MANAGER.success('Email template deleted');
				await invalidate('/api/email-templates');
				await goto('.');
			} else {
				TOAST_MANAGER.error(`Delete failed (${res.status})`);
			}
		} catch (err: any) {
			TOAST_MANAGER.error(err?.message ?? 'Something went wrong');
		}
	}
</script>

<main>
	<a href=".">back</a>
	{#if template != null}
		<EmailTemplateForm bind:template={template} isExisting={true} />
	{/if}
	<div>
		<button onclick={save}>save</button>
		<button onclick={remove}>delete</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}
</style>
