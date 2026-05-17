<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import type { LarpEvent } from '$lib/db/event.repo';
	import type { Character } from '$lib/db/character.repo';
	import { ArrowLeft } from '@lucide/svelte';
	import { page } from '$app/state';
	import type { Skill } from '$lib/db/skills.repo';
	import SkillsOverview from '$lib/components/skills-overview.svelte';
	import ShopSkills from '$lib/codex/components/shop-skills.svelte';
	import ImplantsShop from '$lib/components/implants-shop.svelte';
	import ItemsShop from '$lib/components/items-shop.svelte';
	import type { Implant } from '$lib/db/implants.repo';
	import type { Item } from '$lib/db/items.repo';
	import {
		getEventCharacterVersionManager,
		setEventCharacterVersionManager
	} from '$lib/managers/event-character-version-manager.svelte';

	let { data }: PageProps = $props();
	const event: LarpEvent | null = $derived(data.event);
	const characters: Character[] = $derived(data.characters);
	const skills: Skill[] = $derived(data.skills);
	const implants: Implant[] = $derived(data.implants);
	const items: Item[] = $derived(data.items);
	let selectedCharacterId: string | null = $state(page.url.searchParams.get('character'));
	setEventCharacterVersionManager();
	const characterVersionManager = getEventCharacterVersionManager();

	$effect(() => {
		if (selectedCharacterId == null) return;
		if (page.url.searchParams.get('character') == selectedCharacterId) return;
		goto(`?character=${selectedCharacterId}`);
	});

	$effect(() => {
		if (data.characterVersion == null) return;
		characterVersionManager.reset();
		characterVersionManager.setCharacterVersion(data.characterVersion);
	});

	async function goBack() {
		await goto('.');
	}

	let shop = $state('skills');
	function goToShop(shopRoute: 'skills' | 'implants' | 'items') {
		shop = shopRoute;
	}

	const skillCostById = $derived(new Map(skills.map((s) => [s.id, s.cost ?? 0])));
	const skillsSpent = $derived(
		characterVersionManager.skills.reduce(
			(sum, s) => sum + (skillCostById.get(s.id) ?? 0) * s.value,
			0
		)
	);
	const skillsRemaining = $derived((event?.budget ?? 0) - skillsSpent);
</script>

<main>
	{#if event != null}
		<div class="event-header">
			<a href=".">
				<ArrowLeft />
			</a>
			<h1>{event.name}</h1>
		</div>
		<aside>
			<label for="character-selector">Character</label>
			<select id="character-selector" bind:value={selectedCharacterId}>
				<option value={null}>-- select character --</option>
				{#each characters as character}
					<option value={character.id}>{character.name}</option>
				{/each}
			</select>
			{#if characterVersionManager}
				<dl>
					<dt>
						<h2><button onclick={() => goToShop('skills')}>Skills</button></h2>
					</dt>
					<dd>
						<SkillsOverview {skills} values={characterVersionManager.skills} />
					</dd>
					<dt>
						<h2><button onclick={() => goToShop('implants')}>Implants</button></h2>
					</dt>
					<dd>
						<ul>
							{#each characterVersionManager.implants as charImplantId}
								<li>{implants.find((implant) => charImplantId === implant.id)?.name}</li>
							{/each}
						</ul>
					</dd>
					<dt>
						<h2><button onclick={() => goToShop('items')}>Items</button></h2>
					</dt>
					<dd>
						<ul>
							{#each characterVersionManager.items as charItem}
								<li>{items.find((item) => item.id === charItem.id)?.name}: {charItem.count}</li>
							{/each}
						</ul>
					</dd>
				</dl>
			{/if}
		</aside>
		<section>
			{#if shop === 'skills'}
				<ShopSkills
					catalog={skills}
					bind:selected={characterVersionManager.skills}
					remaining={skillsRemaining}
					budget={event?.budget ?? 0}
				/>
			{/if}
			{#if shop === 'implants'}
				<ImplantsShop {implants} />
			{/if}
			{#if shop === 'items'}
				<ItemsShop {items} />
			{/if}
		</section>
		<div class="event-footer">
			<button>sign-up</button>
			<button onclick={goBack}>cancel</button>
		</div>
	{/if}
</main>

<style>
	main {
		display: grid;
		grid-template-columns: minmax(300px, 1fr) 3fr;
		grid-template-areas:
			'header header'
			'aside section'
			'footer footer';

		flex-direction: column;
		padding: 8px;
		background-color: white;
		gap: 8px;
	}

	h1 {
		font-size: 1.5em;
	}

	h2 button {
		font-size: 1.2em;
		margin: 8px 0;
		width: 100%;
	}

	.event-header {
		grid-area: header;
		display: flex;
		align-items: center;
		gap: 8px;
		border-bottom: 1px solid #ccc;
	}

	aside {
		grid-area: aside;
		border-right: 1px solid #ccc;
		padding: 8px;
	}

	section {
		grid-area: section;
		padding: 8px;
	}

	.event-footer {
		grid-area: footer;
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		border-top: 1px solid #ccc;
	}
</style>
