<script lang="ts">
	import { type RegisterManager } from '../managers/register-manager.svelte';
	import { type CharacterManager } from '../managers/character-manager.svelte';
	import CharacterVersion, {
		type CharacterVersionSkill,
		type CharacterVersionItem,
		type CharacterVersionImplant
	} from './character-version.svelte';

	type EventSummary = { id: number; name: string };

	let {
		REGISTER_MANAGER,
		CHARACTER_MANAGER
	}: { REGISTER_MANAGER: RegisterManager; CHARACTER_MANAGER: CharacterManager } = $props();

	let event = $state<EventSummary | null>(null);
	let displayCharacterName = $state('');
	let displayVersionName = $state<string | undefined>(undefined);
	let displaySkills = $state<CharacterVersionSkill[]>([]);
	let displayItems = $state<CharacterVersionItem[]>([]);
	let displayImplants = $state<CharacterVersionImplant[]>([]);
	let loading = $state(true);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	$effect(() => {
		loadSummary(
			REGISTER_MANAGER.selectedEventId!,
			REGISTER_MANAGER.selectedVersionId,
			REGISTER_MANAGER.selectedCharacterId
		);
	});

	async function loadSummary(eventId: number, versionId: number | null, charId: number | null) {
		loading = true;
		error = null;
		try {
			const [eventData, skillsData, itemsData, implantsData] = await Promise.all([
				fetch(`/api/events/${eventId}`).then((r) => (r.ok ? r.json() : null)),
				fetch('/api/skills').then((r) => (r.ok ? r.json() : [])),
				fetch('/api/items').then((r) => (r.ok ? r.json() : [])),
				fetch('/api/implants').then((r) => (r.ok ? r.json() : []))
			]);

			event = eventData ? { id: eventData.id, name: eventData.name } : null;

			const skillMap = new Map<number, any>((skillsData as any[]).map((s) => [s.id, s]));
			const itemMap = new Map<number, any>((itemsData as any[]).map((i) => [i.id, i]));
			const implantMap = new Map<number, any>((implantsData as any[]).map((i) => [i.id, i]));

			if (charId !== null && versionId !== null) {
				const versions: any[] = await fetch('/api/my/characters/versions').then((r) =>
					r.ok ? r.json() : []
				);
				const version = versions.find((v) => v.versionId === versionId);
				if (version) {
					displayCharacterName = version.characterName;
					displayVersionName = version.versionName;
					displaySkills = (version.skills as any[]).flatMap((s) => {
						const skill = skillMap.get(s.id);
						return skill
							? [
									{
										id: s.id,
										name: skill.name,
										group: s.group,
										groupName: s.groupName,
										value: s.value
									}
								]
							: [];
					});
					displayItems = (version.items as number[]).flatMap((id) => {
						const item = itemMap.get(id);
						return item
							? [{ id, name: item.name, description: item.description || undefined }]
							: [];
					});
					displayImplants = (version.implants as number[]).flatMap((id) => {
						const implant = implantMap.get(id);
						return implant
							? [{ id, name: implant.name, description: implant.description || undefined }]
							: [];
					});
				}
			} else {
				const { draft } = CHARACTER_MANAGER;
				displayCharacterName = draft.name || draft.version.name;
				displayVersionName = undefined;
				displaySkills = draft.version.skills.flatMap((ds) => {
					const skill = skillMap.get(ds.id);
					return skill
						? [
								{
									id: ds.id,
									name: skill.name,
									group: skill.groupId,
									groupName: skill.groupName,
									value: ds.value
								}
							]
						: [];
				});
				displayItems = draft.version.items.flatMap((di) => {
					const item = itemMap.get(di.id);
					return item
						? [{ id: di.id, name: item.name, description: item.description || undefined }]
						: [];
				});
				displayImplants = draft.version.implants.flatMap((id) => {
					const implant = implantMap.get(id);
					return implant
						? [{ id, name: implant.name, description: implant.description || undefined }]
						: [];
				});
			}
		} catch (err) {
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function confirm() {
		if (submitting) return;
		submitting = true;
		error = null;
		try {
			const body = { draft: CHARACTER_MANAGER.draft };
			const res = await fetch(`/api/my/events/${REGISTER_MANAGER.selectedEventId}/participants`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(`registration failed (${res.status})`);
			success = true;
		} catch (err) {
			error = `${err instanceof Error ? err.message : err}`;
		} finally {
			submitting = false;
		}
	}
</script>

<div class="confirm">
	{#if loading}
		<p class="status">loading…</p>
	{:else if success}
		<div class="success">
			<p class="success-title">registration confirmed</p>
			<p class="success-hint">
				you are registered for <span class="highlight">{event?.name}</span> as
				<span class="highlight">{displayCharacterName}</span>
			</p>
		</div>
	{:else}
		<div class="event-row">
			<span class="event-label">event</span>
			<span class="event-name">{event?.name ?? '—'}</span>
			{#if REGISTER_MANAGER.isNewCharacter}
				<span class="badge">new character</span>
			{/if}
		</div>

		{#if displayCharacterName}
			<CharacterVersion
				characterName={displayCharacterName}
				versionName={displayVersionName}
				skills={displaySkills}
				items={displayItems}
				implants={displayImplants}
			/>
		{/if}

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<button class="confirm-btn" onclick={confirm} disabled={submitting}>
			{submitting ? 'confirming…' : 'confirm registration'}
		</button>
	{/if}
</div>

<style>
	.confirm {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		height: 100%;
	}

	.event-row {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
	}

	.event-label {
		font-size: 0.62rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.4;
		flex-shrink: 0;
	}

	.event-name {
		font-size: 0.82rem;
		flex: 1;
	}

	.badge {
		font-size: 0.62rem;
		opacity: 0.5;
		padding: 0.1rem 0.35rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
	}

	.confirm-btn {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		padding: 0.45rem 1rem;
		background: transparent;
		color: var(--color-accent);
		border: 1px solid color-mix(in srgb, var(--color-accent) 50%, transparent);
		cursor: pointer;
		align-self: flex-start;
		transition:
			border-color 0.15s,
			opacity 0.15s;
	}

	.confirm-btn:hover:not(:disabled) {
		border-color: var(--color-accent);
	}

	.confirm-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.error {
		font-size: 0.75rem;
		color: #d95c5c;
		opacity: 0.85;
	}

	.success {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
		padding: 1.25rem;
	}

	.success-title {
		font-size: 0.8rem;
		color: var(--color-accent);
		letter-spacing: 0.06em;
	}

	.success-hint {
		font-size: 0.72rem;
		opacity: 0.55;
	}

	.highlight {
		opacity: 1;
		color: var(--color-main);
	}

	.status {
		font-size: 0.75rem;
		opacity: 0.4;
	}
</style>
