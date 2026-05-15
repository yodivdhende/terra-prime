<script lang="ts">
	import { invalidate } from "$app/navigation";
	import type { NewCharacter } from "$lib/db/character.repo";
	import type { User } from "$lib/db/user.repo";
	import { sidePanelManager } from "$lib/managers/side-panel-manager.svelte";
	import CharacterForm from "../character-form.svelte";

    let character: NewCharacter = $state({
        name: '',
        ownerId: 0,
        maxHp: 10,
    });
    let users: User[] = $state([]);

    fetch('/api/users').then(async (response)=>{
        users = await response.json()
    } );
   async function save(){
        const response = await fetch('/api/characters', {
            method: 'put',
            body: JSON.stringify(character),
        })
        if(response.ok){
            invalidate('/api/my/characters');
            sidePanelManager.close();
        }
    }

</script>

<main>
	<h1>edit character</h1>
	{#if character != null}
		<CharacterForm bind:character {users} />
	{/if}
	<div>
		<button onclick={save}>save</button>
	</div>
</main>

<style>
	main {
		width: 100%;
		height: 100%;
	}
</style>
