<script lang="ts">
	 import { CirclePlus } from '@lucide/svelte';
	import { type PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main>
    <a href="skills/new"><CirclePlus /></a>
	<table>
		<thead>
			<tr>
				<th>Id</th>
				<th><a href="skills/groups/">Main</a></th>
				<th>Name</th>
				<th>Description</th>
			</tr>
		</thead>
        <tbody>
            {#each data.skills as skill}
                <tr>
                    <td><a href="skills/{skill.id}">{skill.id}</a></td>
                    <td>{skill.groupName}</td>
                    <td>{skill.name}</td>
                    <td>{skill.description}</td>
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
