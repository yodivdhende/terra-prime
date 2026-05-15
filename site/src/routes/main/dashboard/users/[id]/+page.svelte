<script lang='ts'>
	import { goto } from "$app/navigation";
	import { untrack } from "svelte";
	import type { PageProps } from "./$types";

    let {data}: PageProps = $props();
    let user = $state(untrack(() => data.user))

    async function save() {
        if(user == null)return;
        try {
            const result = await fetch(`/api/users/${user.id}`, {
                method:'post',
                body: JSON.stringify(user),
                headers: {
				    'content-type': 'application/json',
                }
            })
            if(result.ok) {
                goto('.');
            }
        }catch (err) {
			//TODO make error component;
        }
    }
</script>
<main>
    <a href=".">back</a>
    {#if user}
    <label for="name">Name</label>
    <input type="text" id="name" bind:value={user.name}/>
    <label for="email">Email</label>
    <input type="email" id="email" bind:value={user.email}/>
    {/if}
    <button onclick={save}>Save</button>
</main>
<style>
    main {
        display: flex;
        flex-direction: column;
        gap:8px;
        min-width:300px;
        padding: 8px;
        background-color: white;
    }

</style>