<script lang="ts">
	import { PublicUserRole } from '$lib/types/roles';

	const roles = Object.keys(PublicUserRole);
    let description: string = $state('');
    let selectedRoles: PublicUserRole[] = $state([]);
    let canCreate: boolean = $derived.by(() => {
        if(description.length <= 0) return false;
        if(selectedRoles.length <= 0) return false;
        return true;
    })
</script>

<main>
	<form method="POST">
		<label for="description">description</label>
		<input type="text" id="description" name="description" bind:value={description}/>
		<label for="end">end date</label>
		<input type="date" id="end" name="end" />
		<label for="roles">roles </label>
		<select id="roles" name="roles" multiple bind:value={selectedRoles}>
			{#each roles as role}
				<option value={role} >{role}</option>   
			{/each}
		</select>
		<button disabled={canCreate === false}> create </button>
	</form>
</main>

<style>
	main {
		padding: 16px;
		background-color: white;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
</style>
