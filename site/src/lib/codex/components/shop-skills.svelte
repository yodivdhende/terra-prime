<script lang="ts" module>
	export type ShopSkill = {
		id: number | null;
		name: string;
		description: string;
		cost?: number;
		groupId: number;
		groupName: string;
	};
</script>

<script lang="ts">
	import Icon from './icon.svelte';
	import SkillSlider from './skill-slider.svelte';
	import type { VersionSkill } from '$lib/codex/managers/character-manager.svelte';
	import ProgressBar from './progress-bar.svelte';
	import { GROUP_COLORS, GROUP_ICONS, SKILL_INFO } from '$lib/codex/managers/skill-icons';

	let {
		catalog,
		selected = $bindable<VersionSkill[]>([]),
		remaining,
		budget = 0,
		discounts = new Map()
	}: {
		catalog: ShopSkill[];
		selected: VersionSkill[];
		remaining: number;
		budget?: number;
		discounts?: Map<number, number>;
	} = $props();

	const skillGroups = $derived.by(() => {
		const map = new Map<number, { id: number; name: string; color: string; skills: ShopSkill[] }>();
		for (const s of catalog) {
			if (!map.has(s.groupId)) {
				map.set(s.groupId, {
					id: s.groupId,
					name: s.groupName,
					color: GROUP_COLORS[s.groupId] ?? 'var(--color-accent)',
					skills: []
				});
			}
			map.get(s.groupId)!.skills.push(s);
		}
		return Array.from(map.values());
	});

	const budgetFill = $derived(budget > 0 ? Math.min((budget - remaining) / budget, 1) * 100 : 0);

	function getValue(id: number | null): number {
		if (id == null) return 0;
		return selected.find((s) => s.id === id)?.value ?? 0;
	}

	function setSkillValue(skill: ShopSkill, newValue: number) {
		if (skill.id == null) return;
		if (newValue === 0) {
			selected = selected.filter((s) => s.id !== skill.id);
		} else if (selected.some((s) => s.id === skill.id)) {
			selected = selected.map((s) => (s.id === skill.id ? { ...s, value: newValue } : s));
		} else {
			selected = [
				...selected,
				{
					id: skill.id,
					name: skill.name,
					group: skill.groupId,
					groupName: skill.groupName,
					value: newValue
				}
			];
		}
	}

	const iconSize = '2.5em';
</script>

{#if budget > 0}
	<div class="skillbar" class:over={remaining < 0}>
		<div class="skillbar-labels">
			<span class="skillbar-label">skill budget</span>
			<span class="skillbar-remaining">{remaining} / {budget}</span>
		</div>
		<div class="skillbar-track">
			<div class="skillbar-fill" style:width="{budgetFill}%"></div>
		</div>
	</div>
{/if}

{#if catalog.length === 0}
	<p class="empty">no skills available</p>
{:else}
	{#each skillGroups as group (group.id)}
		{@const groupAverage =
			group.skills.reduce((sum, s) => sum + getValue(s.id), 0) / group.skills.length}
		<div class="group">
			<h4 class="group-name" style="color: {group.color}">
				<Icon src={GROUP_ICONS[group.id]} color={group.color} size={iconSize} />
				{group.name}
			</h4>
			<div class="group-value">
				<ProgressBar value={groupAverage} max={100} color={group.color} name={group.name} />
			</div>
			<ul class="catalog">
				{#each group.skills as skill (skill.id)}
					{@const skillIcon = SKILL_INFO[skill.id ?? 0]?.icon}
					{@const currentValue = getValue(skill.id)}
					{@const skillCost = skill.cost ?? 0}
					{@const skillDiscount = skill.id != null ? (discounts.get(skill.id) ?? 0) : 0}
					{@const effectiveCost = Math.max(0, skillCost - skillDiscount)}
					{@const discounted = skillDiscount > 0 && skillCost > 0}
					<li class="entry" class:owned={currentValue > 0} class:discounted>
						<div class="entry-header">
							{#if skillIcon}
								<Icon src={skillIcon} color={group.color} size={iconSize} />
							{/if}
							<div class="entry-info">
								<span class="entry-name">
									{skill.name}
									{#if discounted}
										<span class="discount-badge" title="company discount: -{skillDiscount}/pt"
											>deal</span
										>
									{/if}
								</span>
								{#if skill.description}
									<span class="entry-desc">{skill.description}</span>
								{/if}
							</div>
						</div>
						<SkillSlider
							value={currentValue}
							color={group.color}
							{remaining}
							cost={effectiveCost}
							name={skill.name}
							max={100}
							onchange={(v) => setSkillValue(skill, v)}
						/>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
{/if}

<style>
	.skillbar {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.skillbar-labels {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.skillbar-label {
		font-size: 0.95em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.5;
	}

	.skillbar-remaining {
		font-size: 1.05em;
		color: var(--color-accent);
	}

	.over .skillbar-remaining {
		color: #d95c5c;
	}

	.skillbar-track {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.skillbar-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 3px;
		transition: width 0.2s;
	}

	.over .skillbar-fill {
		background: #d95c5c;
	}

	.group {
		margin-bottom: 1rem;
	}

	.group-name {
		font-size: 0.92em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 0.35rem;
		font-weight: normal;
		opacity: 0.85;
	}

	.group-value {
		margin-bottom: 1em;
	}

	.catalog {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.entry {
		padding: 0.4rem 0.6rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.entry.owned {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 5%, transparent);
	}

	.entry.discounted {
		border-color: color-mix(in srgb, #4caf82 45%, transparent);
	}

	.entry.discounted.owned {
		border-color: #4caf82;
		background: color-mix(in srgb, #4caf82 5%, transparent);
	}

	.discount-badge {
		display: inline-block;
		margin-left: 0.4rem;
		padding: 0.05rem 0.35rem;
		font-size: 0.7em;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #4caf82;
		border: 1px solid color-mix(in srgb, #4caf82 60%, transparent);
		vertical-align: middle;
	}

	.entry-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.entry-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		flex: 1;
		min-width: 0;
	}

	.entry-name {
		font-size: 1.05em;
		letter-spacing: 0.03em;
	}

	.entry-desc {
		font-size: 0.95em;
		opacity: 0.5;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.empty {
		font-size: 1em;
		opacity: 0.4;
		font-style: italic;
	}
</style>
