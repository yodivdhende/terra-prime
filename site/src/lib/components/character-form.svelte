<script lang='ts'>
	import type {  NewCharacter } from "$lib/db/character.repo";

    let {character = $bindable<NewCharacter>(), users} = $props();
</script>
<main>
		<label for="owner">owner</label>
        {#if users != null}
        <select id="owner" bind:value={character.ownerId}>
            {#each users as owner (owner.id)}
                <option value={owner.id}>{owner.name}</option>
            {/each}
        </select>
        {/if}
		<label for="name">name</label>
		<input id="name" type="text" bind:value={character.name} />
		<!-- An `npc` is authored by the organisation and handed to an event's extras; the version
		     editor and the sheet renderer are the same either way. -->
		<label for="kind">kind</label>
		<select id="kind" bind:value={character.kind}>
			<option value="player">player</option>
			<option value="npc">npc</option>
		</select>
		<label for="implantLimit">implant limit</label>
		<input id="implantLimit" type="number" min="0" bind:value={character.implantLimit} />
</main>
<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
