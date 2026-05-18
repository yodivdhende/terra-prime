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
	import ChemistryIcon from '$lib/assets/images/SkillLogo-Chemistry.svg?raw';
	import CommunicationSystemsIcon from '$lib/assets/images/SkillLogo-CommunicationSystems.svg?raw';
	import EcologieIcon from '$lib/assets/images/SkillLogo-Ecologie.svg?raw';
	import ElectricalEngineeringIcon from '$lib/assets/images/SkillLogo-ElectricalEngineering.svg?raw';
	import EngineeringIcon from '$lib/assets/images/SkillLogo-Engineering.svg?raw';
	import HistoryicalAnalysisIcon from '$lib/assets/images/SkillLogo-HistoryicalAnalysis.svg?raw';
	import InformationTechnologyIcon from '$lib/assets/images/SkillLogo-InformationTechnology.svg?raw';
	import LifeSciencesIcon from '$lib/assets/images/SkillLogo-LifeSciences.svg?raw';
	import MechanicalEngineeringIcon from '$lib/assets/images/SkillLogo-MechanicalEngineering.svg?raw';
	import MedicalAndTraumaCareIcon from '$lib/assets/images/SkillLogo-MedicalAndTraumaCare.svg?raw';
	import SocialeWetenschapIcon from '$lib/assets/images/SkillLogo-SocialeWetenschap.svg?raw';
	import SocialogyAndDiplomacyIcon from '$lib/assets/images/SkillLogo-SocialogyAndDiplomacy.svg?raw';
	import SoftwareAndHakcingIcon from '$lib/assets/images/SkillLogo-SoftwareAndHakcing.svg?raw';
	import Icon from './icon.svelte';
	import SegmentBar from './segment-bar.svelte';
	import type { VersionSkill } from '$lib/codex/managers/character-manager.svelte';

	const GROUP_COLOR: Record<number, string> = {
		1: '#f0c040',
		2: '#4caf82',
		3: '#4a9edd',
		4: '#d95c5c'
	};

	const SKILL_ICONS: Record<number, string> = {
		1: MechanicalEngineeringIcon,
		2: ElectricalEngineeringIcon,
		3: MedicalAndTraumaCareIcon,
		4: ChemistryIcon,
		5: EcologieIcon,
		6: SoftwareAndHakcingIcon,
		7: CommunicationSystemsIcon,
		8: HistoryicalAnalysisIcon,
		9: SocialogyAndDiplomacyIcon
	};

	const GROUP_ICONS: Record<number, string> = {
		1: EngineeringIcon,
		2: LifeSciencesIcon,
		3: InformationTechnologyIcon,
		4: SocialeWetenschapIcon
	};

	let {
		catalog,
		selected = $bindable<VersionSkill[]>([]),
		remaining,
		budget = 0
	}: {
		catalog: ShopSkill[];
		selected: VersionSkill[];
		remaining: number;
		budget?: number;
	} = $props();

	const skillGroups = $derived.by(() => {
		const map = new Map<number, { id: number; name: string; color: string; skills: ShopSkill[] }>();
		for (const s of catalog) {
			if (!map.has(s.groupId)) {
				map.set(s.groupId, {
					id: s.groupId,
					name: s.groupName,
					color: GROUP_COLOR[s.groupId] ?? 'var(--color-accent)',
					skills: []
				});
			}
			map.get(s.groupId)!.skills.push(s);
		}
		return Array.from(map.values());
	});

	const budgetFill = $derived(budget > 0 ? Math.min((budget - remaining) / budget, 1) * 100 : 0);

	function getSkillIcon(id: number): string | undefined {
		return SKILL_ICONS[name.toLowerCase().replace(/[^a-z0-9]/g, '')];
	}

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
		<div class="group">
			<h4 class="group-name" style="color: {group.color}">
				{group.name}
				<Icon src={GROUP_ICONS[group.id]} color={group.color} size="0.9rem" />
			</h4>
			<ul class="catalog">
				{#each group.skills as skill (skill.id)}
					{@const skillIcon = SKILL_ICONS[skill.id ?? 0]}
					{@const currentValue = getValue(skill.id)}
					{@const skillCost = skill.cost ?? 0}
					<li class="entry" class:owned={currentValue > 0}>
						<div class="entry-header">
							{#if skillIcon}
								<Icon src={skillIcon} color={group.color} size="0.9rem" />
							{/if}
							<div class="entry-info">
								<span class="entry-name">{skill.name}</span>
								{#if skill.description}
									<span class="entry-desc">{skill.description}</span>
								{/if}
							</div>
							{#if skillCost > 0 && currentValue > 0}
								<span class="entry-cost">{skillCost * currentValue}</span>
							{:else if skillCost > 0}
								<span class="entry-cost muted">{skillCost}/pt</span>
							{/if}
						</div>
						<SegmentBar
							value={currentValue}
							color={group.color}
							{remaining}
							cost={skillCost}
							name={skill.name}
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
		font-size: 0.95rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.5;
	}

	.skillbar-remaining {
		font-size: 1.05rem;
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
		font-size: 0.92rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin: 0 0 0.35rem;
		font-weight: normal;
		opacity: 0.85;
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
		font-size: 1.05rem;
		letter-spacing: 0.03em;
	}

	.entry-desc {
		font-size: 0.95rem;
		opacity: 0.5;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.entry-cost {
		font-size: 1.0rem;
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.entry-cost.muted {
		opacity: 0.4;
	}

	.empty {
		font-size: 1.0rem;
		opacity: 0.4;
		font-style: italic;
	}
</style>
