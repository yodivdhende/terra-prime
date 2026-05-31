<script lang="ts">
	import type { GoogleFormItem } from '$lib/services/google-form-service';
	import type { forms_v1 } from 'googleapis';

	let {
		item,
		answers,
		setAnswer,
		toggleCheckbox
	}: {
		item: GoogleFormItem;
		answers: Record<string, string | string[]>;
		setAnswer: (id: string, value: string | string[]) => void;
		toggleCheckbox: (id: string, option: string) => void;
	} = $props();

	const group = $derived(item.questionGroupItem!);
	const columns = $derived(group.grid?.columns?.options ?? []);
	const isCheckbox = $derived(group.grid?.columns?.type === 'CHECKBOX');
	const rows = $derived(group.questions ?? []);

	$inspect(group);
	$inspect(isCheckbox);
</script>

<div class="grid-question">
	{#if item.title}
		<span class="q-title">{item.title}</span>
	{/if}
	{#if item.description}
		<span class="q-desc">{item.description}</span>
	{/if}

	<div class="grid-wrap">
		<table class="grid-table">
			<thead>
				<tr>
					<th class="row-label-head"></th>
					{#each columns as col, i (i)}
						<th class="col-head">{col.value ?? ''}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.questionId)}
					{@const qid = row.questionId ?? ''}
					{@const rowTitle = (row as forms_v1.Schema$Question).rowQuestion?.title ?? ''}
					<tr>
						<td class="row-label">
							{rowTitle}
							{#if row.required}<span class="required">*</span>{/if}
						</td>
						{#each columns as col, i (i)}
							{@const colVal = col.value ?? ''}
							<td class="grid-cell">
								{#if isCheckbox}
									<input
										type="checkbox"
										checked={((answers[qid] as string[]) ?? []).includes(colVal)}
										onchange={() => toggleCheckbox(qid, colVal)}
									/>
								{:else}
									<input
										type="radio"
										name={qid}
										value={colVal}
										required={row.required ?? false}
										checked={(answers[qid] as string) === colVal}
										onchange={() => setAnswer(qid, colVal)}
									/>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.grid-question {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.q-title {
		display: block;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-main);
	}

	.q-desc {
		display: block;
		font-size: 0.7rem;
		color: var(--color-main-dim);
		margin: 0.15rem 0 0.35rem;
	}

	.required {
		color: var(--color-warning);
		margin-left: 0.25rem;
	}

	.grid-wrap {
		overflow-x: auto;
		margin-top: 0.25rem;
	}

	.grid-table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.78rem;
	}

	.col-head {
		text-align: center;
		color: var(--color-main-dim);
		font-weight: normal;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.25rem 0.5rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 20%, transparent);
		white-space: nowrap;
	}

	.row-label-head {
		min-width: 6rem;
	}

	.row-label {
		color: var(--color-main);
		padding: 0.3rem 0.75rem 0.3rem 0;
		white-space: nowrap;
		font-size: 0.78rem;
	}

	.grid-cell {
		text-align: center;
		padding: 0.3rem 0.5rem;
	}

	.grid-cell input {
		accent-color: var(--color-accent);
	}

	tr:nth-child(even) {
		background: color-mix(in srgb, var(--color-accent) 4%, transparent);
	}
</style>
