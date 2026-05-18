<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main>
    <a href="items/new"><CirclePlus /></a>
	<table>
		<thead>
			<tr>
				<th>Id</th>
				<th>Name</th>
				<th>start</th>
				<th>end</th>
			</tr>
		</thead>
        <tbody>
            {#each data.items as item}
                <tr>
                    <td><a href="items/{item.id}">{item.id}</a></td>
                    <td>{item.name}</td>
                    <td>{item.description}</td>
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
        background-color: white;
    }
    tr {
        border-bottom: 1px solid silver;
    }
    td{
        padding: 16px 8px;
    }
</style>
