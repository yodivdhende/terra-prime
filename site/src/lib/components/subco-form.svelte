<script lang="ts">
	import type { Subco } from '$lib/db/subco.repo';
	import type { Company } from '$lib/db/companies.repo';
	import type { Character } from '$lib/db/character.repo';
	import CompanySelect from '$lib/components/company-select.svelte';
	import BackstoryLink from '$lib/components/backstory-link.svelte';

	let {
		subco = $bindable<Subco>(),
		charactersEndpoint = '/api/characters',
		onInvite
	}: {
		subco: Subco;
		charactersEndpoint?: string;
		onInvite?: (email: string) => void | Promise<void>;
	} = $props();

	let characters = $state<Character[]>([]);
	let inviteEmail = $state('');

	// company-select binds a whole Company object; keep subco.company in sync.
	let selectedCompany = $state<Company | null>(
		subco.company ? ({ id: subco.company } as Company) : null
	);
	$effect(() => {
		if (selectedCompany?.id != null) subco.company = selectedCompany.id;
	});

	$effect(() => {
		fetch(charactersEndpoint)
			.then((r) => r.json())
			.then((data: Character[]) => {
				if (Array.isArray(data)) characters = data;
			});
	});

	function toggleMember(characterId: number, checked: boolean) {
		if (checked) {
			if (!subco.members.includes(characterId)) subco.members = [...subco.members, characterId];
		} else {
			subco.members = subco.members.filter((id) => id !== characterId);
		}
	}

	async function invite() {
		const email = inviteEmail.trim();
		if (email.length === 0 || onInvite == null) return;
		await onInvite(email);
		inviteEmail = '';
	}
</script>

<div class="form">
	<label for="subco-name">name</label>
	<input id="subco-name" type="text" bind:value={subco.name} />

	<label for="subco-company">company</label>
	<CompanySelect bind:company={selectedCompany} />

	<span class="label">members</span>
	<div class="members">
		{#each characters as character (character.id)}
			<label class="member">
				<input
					type="checkbox"
					checked={subco.members.includes(character.id)}
					onchange={(e) => toggleMember(character.id, e.currentTarget.checked)}
				/>
				{character.name} <span class="owner">({character.ownerName})</span>
			</label>
		{/each}
	</div>

	<span class="label">shared background</span>
	<BackstoryLink
		characterId={subco.id}
		characterName={subco.name}
		bind:backstoryId={subco.backstoryId}
		idEndpoint={(id) => `/api/subco/${id}/backstory`}
		newEndpoint="/api/my/subco/backstory"
		newPayloadKey="subcoName"
	/>

	{#if onInvite}
		<label for="subco-invite">invite by email</label>
		<div class="invite">
			<input
				id="subco-invite"
				type="email"
				bind:value={inviteEmail}
				placeholder="player@example.com"
				disabled={subco.id == null}
			/>
			<button class="btn" type="button" onclick={invite} disabled={subco.id == null}>invite</button>
		</div>
		{#if subco.id == null}
			<span class="hint">save the subco before inviting players</span>
		{/if}
	{/if}
</div>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--color-accent);
	}

	.members {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 200px;
		overflow-y: auto;
	}

	.member {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.9em;
	}

	.owner {
		color: var(--color-main-dim);
		font-size: 0.85em;
	}

	.invite {
		display: flex;
		gap: 8px;
	}

	.invite input {
		flex: 1;
	}

	.hint {
		font-family: var(--font-mono);
		font-size: 0.75em;
		color: var(--color-main-dim);
	}
</style>
