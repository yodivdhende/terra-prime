<script lang="ts">
	import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main>
    <a href="implants/new"><CirclePlus /></a>
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
            {#each data.implants as implant}
                <tr>
                    <td><a href="implants/{implant.id}">{implant.id}</a></td>
                    <td>{implant.name}</td>
                    <td>{implant.description}</td>
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
