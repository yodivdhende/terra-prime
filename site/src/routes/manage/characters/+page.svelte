<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main>
    <a href='characters/new'><CirclePlus /></a>
	<table>
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>Player</th>
				<th>Backstory</th>
			</tr>
		</thead>
        <tbody>
            {#each data.characters as character}
                <tr>
                    <td><a href="characters/{character.id}">{character.id}</a></td>
                    <td>{character.name}</td>
                    <td>{character.ownerName}</td>
                    <td>
                        {#if character.backstoryUrl}
                            <a href={character.backstoryUrl} target="_blank" rel="noopener noreferrer">Open</a>
                        {/if}
                    </td>
                </tr>
            {/each}
        </tbody>
	</table>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        justify-content: end;
        align-items: end;
        gap: 8px;
        padding: 16px;
    }
    tr {
        border-bottom: 1px solid silver;
    }
    td{
        padding: 16px 8px;
    }
</style>
