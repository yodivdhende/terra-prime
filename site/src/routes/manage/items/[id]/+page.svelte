<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ItemForm from '$lib/components/item-form.svelte';
	import CharacterAccessSelect from '$lib/components/character-access-select.svelte';
	import type { Item } from '$lib/db/items.repo';
	import type { PageProps } from './$types';
	import { TOAST_MANAGER } from '$lib/managers/toast-manager.svelte';

	let { data }: PageProps = $props();
	let item: Item | null = $state(null);
	$effect(()=> {
		const {item:loaditem} = data;
		item = loaditem ?? null;
	})

	async function save() {
		const itemToSave = $state.snapshot(item);
		if(itemToSave == null) return;
		const {id: itemId} = itemToSave;
		if(itemId == null) return;
		try {
			const result = await fetch(`/api/items/${itemId}`, {
				method: 'post',
				body: JSON.stringify(itemToSave),
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				TOAST_MANAGER.success('Item saved');
				await invalidate('/api/my/characters');
				await goto(resolve('/manage/items'));
			} else {
				TOAST_MANAGER.error('Failed to save item');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
    }

	async function remove() {
		const itemToSave = $state.snapshot(item);
		if(itemToSave == null) return;
		const {id: itemId} = itemToSave;
		if(itemId == null) return;
		try {
			const result = await fetch(`/api/items/${itemId}`, {
				method: 'delete',
				headers: {
					'content-type': 'application/json',
				}
			})
			if(result.ok) {
				TOAST_MANAGER.success('Item deleted');
				await goto(resolve('/manage/items'));
			} else {
				TOAST_MANAGER.error('Failed to delete item');
			}
		} catch (err) {
			TOAST_MANAGER.error(err instanceof Error ? err.message : 'Something went wrong');
		}
	 }

</script>

<main>
	<a href={resolve('/manage/items')}>back</a>
	{#if item != null}
		<ItemForm bind:item={ item } />

		<fieldset>
			<legend>Character Access</legend>
			<label>
				<input type="radio" bind:group={item.characterAccess} value="all" />
				All characters
			</label>
			<label>
				<input type="radio" bind:group={item.characterAccess} value="none" />
				No characters
			</label>
			<label>
				<input type="radio" bind:group={item.characterAccess} value="specific" />
				Specific characters
			</label>
			{#if item.characterAccess === 'specific'}
				<CharacterAccessSelect
					characters={data.characters ?? []}
					bind:selectedIds={
						() => item!.allowedCharacterIds ?? [],
						(v) => (item!.allowedCharacterIds = v)
					}
				/>
			{/if}
		</fieldset>
	{/if}
	<div>
		<button class="btn" onclick={save}>save</button>
		<button class="btn btn-danger" onclick={remove}>delete</button>
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 8px;
	}

	fieldset {
		border: 1px solid var(--color-border, #444);
		border-radius: 4px;
		padding: 8px 12px;
		margin-top: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	legend {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
		padding: 0 4px;
	}

	label {
		display: flex;
		align-items: center;
		gap: 6px;
		cursor: pointer;
	}

</style>
