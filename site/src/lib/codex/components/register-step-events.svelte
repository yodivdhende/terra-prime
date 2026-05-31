<script lang="ts">
	import type { StringLarpEvent } from '$lib/db/event.repo';
	import { type RegisterManager } from '../managers/register-manager.svelte';
	import FormFields from './form-fields.svelte';

	let { REGISTER_MANAGER }: { REGISTER_MANAGER: RegisterManager } = $props();
	let event = $state<StringLarpEvent | null>(null);
	let loading = $state(true);

	async function loadEvent() {
		const res = await fetch('/api/events/open');
		if (res.ok) {
			const events: StringLarpEvent[] = await res.json();
			event = events[0] ?? null;
			REGISTER_MANAGER.events = events;
			if (event && event.id != null) REGISTER_MANAGER.selectEvent(event.id);
		}
		loading = false;
	}

	$effect(() => {
		loadEvent();
	});

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="events">
	{#if loading}
		<p class="status">loading…</p>
	{:else if !event}
		<p class="status empty">no open events at this time</p>
	{:else}
		<div class="event">
			<span class="name">{event.name}</span>
			<span class="dates">{formatDate(event.start)} – {formatDate(event.end)}</span>
		</div>

		{#if REGISTER_MANAGER.selectedFormId}
			{#if REGISTER_MANAGER.formLoading}
				<p class="status">loading form…</p>
			{:else if REGISTER_MANAGER.formError || !REGISTER_MANAGER.form}
				<p class="status error">failed to load form</p>
			{:else}
				<div class="form-fields">
					{#if REGISTER_MANAGER.form.info?.title}
						<div class="form-header">
							<span class="form-title">{REGISTER_MANAGER.form.info.title}</span>
							{#if REGISTER_MANAGER.form.info?.description}
								<p class="form-desc">{REGISTER_MANAGER.form.info.description}</p>
							{/if}
						</div>
					{/if}
					<FormFields
						form={REGISTER_MANAGER.form}
						answers={REGISTER_MANAGER.formAnswers}
						setAnswer={REGISTER_MANAGER.setAnswer}
						toggleCheckbox={REGISTER_MANAGER.toggleCheckbox}
					/>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.events {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.form-title {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-accent);
	}

	.form-desc {
		font-size: 0.72rem;
		color: var(--color-main-dim);
		margin: 0;
	}

	.event {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		padding: 0.6rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.name {
		font-size: 0.8em;
		letter-spacing: 0.04em;
	}

	.dates {
		font-size: 0.7em;
		opacity: 0.5;
		white-space: nowrap;
	}

	.status {
		font-size: 0.75em;
		opacity: 0.4;
	}

	.status.empty {
		font-style: italic;
	}

	.status.error {
		color: var(--color-warning);
		opacity: 1;
	}
</style>
