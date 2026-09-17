<script lang="ts">
	import { CirclePlus, User, Users } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { ExpertiseGroupBucket } from '$lib/components/character-expertise-groups.svelte';
	import ExpertiseTestCard from '$lib/components/expertise-test-card.svelte';
	import type { PageProps } from './$types';

	type TestTarget = { kind: 'expertise' | 'group'; id: number | null; value: number };

	type ExpertiseTest = {
		/** Client-side only: a test has no id, and targets have none until one is picked. */
		key: number;
		name: string;
		effort: 'single' | 'group';
		targets: TestTarget[];
	};

	let { data }: PageProps = $props();

	/* The flatMap narrows the nullable ids away; both lists are sorted for the picker. */
	const expertise = $derived(
		data.expertise
			.flatMap((entry) => (entry.id == null ? [] : [{ ...entry, id: entry.id }]))
			.sort((a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name))
	);
	const groups = $derived(
		data.groups
			.flatMap((group) => (group.id == null ? [] : [{ ...group, id: group.id }]))
			.sort((a, b) => a.name.localeCompare(b.name))
	);

	let tests = $state<ExpertiseTest[]>([]);
	let nextKey = 0;

	function addTest() {
		nextKey += 1;
		tests.push({ key: nextKey, name: '', effort: 'single', targets: [emptyTarget()] });
	}

	function emptyTarget(): TestTarget {
		return { kind: 'expertise', id: null, value: 50 };
	}

	function selectTarget(target: TestTarget, value: string) {
		const [kind, id] = value.split(':');
		if (kind !== 'expertise' && kind !== 'group') {
			target.id = null;
			return;
		}
		target.kind = kind;
		target.id = Number(id);
	}

	function clamp(value: number | null) {
		if (value == null || Number.isNaN(value)) return 0;
		return Math.min(100, Math.max(0, Math.round(value)));
	}

	/**
	 * Fold a test's targets into the shape CharacterExpertiseGroups renders, so a card's bars are
	 * the same component the character sheet uses. A group with only expertise targets keeps
	 * `value: null` — its bar would otherwise be an average nobody asked for.
	 */
	function bucketsFor(test: ExpertiseTest): ExpertiseGroupBucket[] {
		const buckets: ExpertiseGroupBucket[] = [];

		function bucketFor(group: {
			id: number;
			name: string;
			icon?: string | null;
			color?: string | null;
		}) {
			let bucket = buckets.find((candidate) => candidate.id === group.id);
			if (bucket == null) {
				bucket = {
					id: group.id,
					name: group.name,
					icon: group.icon ?? null,
					color: group.color ?? null,
					value: null,
					expertise: []
				};
				buckets.push(bucket);
			}
			return bucket;
		}

		for (const target of test.targets) {
			if (target.id == null) continue;

			if (target.kind === 'group') {
				const group = groups.find((candidate) => candidate.id === target.id);
				if (group == null) continue;
				// Last target for a group wins, so a card never shows the same bar twice.
				bucketFor(group).value = target.value;
				continue;
			}

			const entry = expertise.find((candidate) => candidate.id === target.id);
			if (entry == null) continue;
			// An expertise carries its group's icon and colour, so a group absent from the groups
			// endpoint still renders with its own styling.
			const bucket = bucketFor({
				id: entry.groupId,
				name: entry.groupName,
				icon: entry.groupIcon,
				color: entry.groupColor
			});
			bucket.expertise = [
				...(bucket.expertise ?? []).filter((existing) => existing.id !== entry.id),
				{
					id: entry.id,
					group: entry.groupId,
					groupName: entry.groupName,
					name: entry.name,
					value: target.value,
					icon: entry.icon ?? null,
					groupIcon: entry.groupIcon ?? null,
					groupColor: entry.groupColor ?? null
				}
			];
		}

		return buckets;
	}
</script>

<main>
	<div class="no-print">
		<a href={resolve('/manage/expertise')}>back</a>
		<h1>expertise tests</h1>
		<p class="hint">
			A test is the target a player has to reach: pick one or more expertises and/or whole expertise
			groups, and set how far the bar has to be filled. Hold the printed card next to a character
			sheet to settle the check. Tests are not saved &mdash; they live until you leave this page, so
			print them before you go.
		</p>

		<div class="toolbar">
			<button class="add" onclick={addTest} aria-label="add test"><CirclePlus /></button>
			<button class="btn" onclick={() => window.print()} disabled={tests.length === 0}>
				print
			</button>
		</div>

		{#each tests as test, testIndex (test.key)}
			<section class="editor">
				<div class="editor-head">
					<input
						type="text"
						placeholder="test name"
						bind:value={test.name}
						aria-label="test name"
					/>
					<div class="effort-toggle">
						<button
							class="effort-option"
							class:active={test.effort === 'single'}
							aria-pressed={test.effort === 'single'}
							onclick={() => (test.effort = 'single')}
						>
							<User size="1.1em" /> single
						</button>
						<button
							class="effort-option"
							class:active={test.effort === 'group'}
							aria-pressed={test.effort === 'group'}
							onclick={() => (test.effort = 'group')}
						>
							<Users size="1.1em" /> group
						</button>
					</div>
					<button
						class="btn btn-danger"
						onclick={() => (tests = tests.filter((_, index) => index !== testIndex))}
					>
						remove test
					</button>
				</div>

				{#each test.targets as target, targetIndex (targetIndex)}
					<div class="target" class:unset={target.id == null}>
						<select
							aria-label="target"
							value={target.id == null ? '' : `${target.kind}:${target.id}`}
							onchange={(event) => selectTarget(target, event.currentTarget.value)}
						>
							<option value="">pick an expertise or group</option>
							<optgroup label="groups">
								{#each groups as group (group.id)}
									<option value="group:{group.id}">{group.name}</option>
								{/each}
							</optgroup>
							<optgroup label="expertise">
								{#each expertise as entry (entry.id)}
									<option value="expertise:{entry.id}">{entry.groupName} / {entry.name}</option>
								{/each}
							</optgroup>
						</select>
						<input
							type="number"
							min="0"
							max="100"
							step="1"
							aria-label="target value"
							bind:value={() => target.value, (value) => (target.value = clamp(value))}
						/>
						<button
							class="btn"
							onclick={() =>
								(test.targets = test.targets.filter((_, index) => index !== targetIndex))}
						>
							remove
						</button>
					</div>
				{/each}

				<button class="add add--inline" onclick={() => test.targets.push(emptyTarget())}>
					<CirclePlus size={16} /> add target
				</button>
			</section>
		{:else}
			<p class="hint">No tests yet. Use the + above to add one.</p>
		{/each}
	</div>

	<div class="cards">
		{#each tests as test (test.key)}
			<ExpertiseTestCard name={test.name} effort={test.effort} groups={bucketsFor(test)} />
		{/each}
	</div>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px;
	}

	.no-print {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.hint {
		opacity: 0.6;
		font-size: 0.9em;
		max-width: 70ch;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.add {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border: none;
		background: none;
		padding: 0;
		color: var(--color-accent);
		font: inherit;
		cursor: pointer;
	}

	.add--inline {
		align-self: start;
		font-size: 0.9em;
	}

	.editor {
		display: flex;
		flex-direction: column;
		gap: 8px;
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius);
		padding: 12px;
	}

	.editor-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.effort-toggle {
		display: flex;
		gap: 4px;
	}

	.effort-option {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius);
		background: none;
		padding: 4px 10px;
		color: var(--color-main-dim);
		font: inherit;
		cursor: pointer;
	}

	.effort-option.active {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.target {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	/* A target with nothing picked is skipped when building the card. */
	.target.unset select {
		border-color: var(--color-warning);
	}

	.target input[type='number'] {
		width: 90px;
	}

	/* Wide enough that a card always has room for the sheet's full 460px of bar. */
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(540px, 1fr));
		gap: 16px;
	}

	@page {
		size: A4;
		margin: 12mm;
	}

	@media print {
		.no-print {
			display: none !important;
		}

		main {
			gap: 0;
			padding: 0;
		}

		/*
		 * One card per row: two would leave under 95mm each, and the bars have to stay the 460px
		 * the character sheet draws them at. Cards still stack several to a page.
		 */
		.cards {
			grid-template-columns: 1fr;
			gap: 8mm;
		}
	}
</style>
