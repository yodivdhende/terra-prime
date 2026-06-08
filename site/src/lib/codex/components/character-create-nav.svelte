<script lang="ts" module>
	export type Step = 'details' | 'skills' | 'items' | 'implants';
	export type NavSkillGroup = { id: number; group: number; groupName: string; value: number };
</script>

<script lang="ts">
	import CharacterSkillGroups from './character-skill-groups.svelte';
	import Icon from './icon.svelte';
	import itemLogo from '$lib/assets/images/ItemLogo.svg?raw';
	import implantLogo from '$lib/assets/images/ImplantLogo.svg?raw';

	let {
		activeStep = $bindable<Step>('details'),
		name,
		skills,
		items,
		implants,
		budget,
		remaining
	}: {
		activeStep: Step;
		name: string;
		skills: { count: number; groups: NavSkillGroup[]; spent: number };
		items: { count: number; total: number; spent: number };
		implants: { count: number; spent: number };
		budget: number;
		remaining: number;
	} = $props();

	const iconSize = '2em';
</script>

<nav class="nav scroll">
	<ul class="steps">
		<li class="step" class:active={activeStep === 'details'}>
			<button type="button" onclick={() => (activeStep = 'details')}>
				<span class="step-label">details</span>
				<span class="step-overview">
					<span class="overview-name" class:empty={!name.trim()}>
						{name.trim() || '—'}
					</span>
				</span>
			</button>
		</li>

		<li class="step" class:active={activeStep === 'skills'}>
			<button type="button" onclick={() => (activeStep = 'skills')}>
				<span class="step-label">
					skills
					{#if skills.count > 0}
						<span class="step-count">{skills.count}</span>
					{/if}
				</span>
				<span class="step-overview">
					{#if skills.groups.length > 0}
						<CharacterSkillGroups skills={skills.groups} size={iconSize} />
					{:else}
						<span class="overview-empty">none selected</span>
					{/if}
					{#if skills.spent > 0}
						<span class="overview-cost">{skills.spent}</span>
					{/if}
				</span>
			</button>
		</li>

		<li class="step" class:active={activeStep === 'items'}>
			<button type="button" onclick={() => (activeStep = 'items')}>
				<span class="step-label">
					items
					{#if items.count > 0}
						<span class="step-count">{items.count}</span>
					{/if}
				</span>
				<span class="step-overview">
					{#if items.total > 0}
						<span class="overview-stat">
							<Icon src={itemLogo} color="white" tooltip="Items" size={iconSize} />
							{items.total}
						</span>
						<span class="overview-cost">{items.spent}</span>
					{:else}
						<span class="overview-empty">none selected</span>
					{/if}
				</span>
			</button>
		</li>

		<li class="step" class:active={activeStep === 'implants'}>
			<button type="button" onclick={() => (activeStep = 'implants')}>
				<span class="step-label">
					implants
					{#if implants.count > 0}
						<span class="step-count">{implants.count}</span>
					{/if}
				</span>
				<span class="step-overview">
					{#if implants.count > 0}
						<span class="overview-stat">
							<Icon src={implantLogo} color="white" tooltip="Implants" size={iconSize} />
							{implants.count}
						</span>
					{:else}
						<span class="overview-empty">none selected</span>
						<span class="overview-cost">{implants.spent}</span>
					{/if}
				</span>
			</button>
		</li>
	</ul>

	{#if budget > 0}
		<div class="budget" class:over={remaining < 0}>
			<span class="budget-label">total cost</span>
			<span class="budget-value">
				<span class="remaining">{remaining}</span>
				<span class="sep">/</span>
				<span class="total">{budget}</span>
			</span>
		</div>
	{/if}
</nav>

<style>
	.nav {
		display: flex;
		flex-direction: column;
		border-right: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		overflow-y: auto;
	}

	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		flex: 1;
	}

	.step button {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 0.75rem 0.85rem;
		background: transparent;
		border: none;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 10%, transparent);
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}

	.step button:hover {
		background: color-mix(in srgb, var(--color-accent) 5%, transparent);
	}

	.step.active button {
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		border-left: 2px solid var(--color-accent);
		padding-left: calc(0.85rem - 2px);
	}

	.step-label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.95em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-main);
		opacity: 0.55;
	}

	.step.active .step-label {
		color: var(--color-accent);
		opacity: 0.9;
	}

	.step-count {
		font-size: 0.9em;
		padding: 0.05rem 0.35rem;
		background: color-mix(in srgb, var(--color-accent) 20%, transparent);
		color: var(--color-accent);
		border-radius: 999px;
		letter-spacing: 0;
	}

	.step-overview {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.4rem;
		min-height: 1.2rem;
	}

	.overview-name {
		font-size: 1.05em;
		color: var(--color-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.overview-name.empty {
		opacity: 0.3;
	}

	.overview-empty {
		font-size: 0.95em;
		opacity: 0.3;
		font-style: italic;
	}

	.overview-stat {
		font-size: 1em;
		color: var(--color-main);
	}

	.overview-cost {
		font-size: 1em;
		color: var(--color-accent);
		opacity: 0.75;
		margin-left: auto;
		flex-shrink: 0;
	}

	.budget {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.75rem 0.85rem;
		border-top: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.budget-label {
		font-size: 0.9em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.45;
	}

	.budget-value {
		font-size: 1.2em;
		color: var(--color-accent);
		letter-spacing: 0.04em;
	}

	.budget.over .remaining {
		color: #d95c5c;
	}

	.sep {
		opacity: 0.3;
		margin: 0 0.2rem;
	}

	.total {
		opacity: 0.45;
	}
</style>
