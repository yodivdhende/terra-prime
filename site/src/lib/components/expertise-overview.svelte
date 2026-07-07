<script lang="ts">
	import type { Expertise } from '$lib/db/expertise.repo';
	import { groupExpertise } from '$lib/utils/expertise.svelte';
	import ProgressBar from '$lib/components/progress-bar.svelte';

	let { expertise, values }: { expertise: Expertise[]; values: { id: number; value: number }[] } =
		$props();

	let groupedExpertise = $derived(groupExpertise(expertise));
	$effect(() => fillExpertise(groupedExpertise, values));

	function fillExpertise(groups: typeof groupedExpertise, values: { id: number; value: number }[]) {
		values.forEach((entry) => groups.forEach((group) => group.setValueOfExpertise(entry)));
	}
</script>

<dl>
	{#each groupedExpertise as group}
		<dt>
			<h3>{group.name}</h3>
			<ProgressBar value={group.average} color="var(--color-accent)" name={group.name} />
		</dt>
		{#each group.expertise as entry}
			<dd>
				<span class="expertise-name">* {entry.name}</span>
				<ProgressBar value={entry.value ?? 0} color="var(--color-accent)" name={entry.name} />
			</dd>
		{/each}
	{/each}
</dl>

<style>
	dl {
		max-width: 300px;
	}

	h3 {
		font-weight: bold;
	}

	dd {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.expertise-name {
		flex-shrink: 0;
	}
</style>
