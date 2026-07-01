<script lang="ts" module>
	export type CharacterVersionSkill = {
		id: number;
		name: string;
		group: number;
		groupName: string;
		value: number;
	};

	export type CharacterVersionItem = {
		id: number;
		name: string;
		description?: string;
	};

	export type CharacterVersionImplant = {
		id: number;
		name: string;
		description?: string;
		slot?: number;
	};
</script>

<script lang="ts">
	import ChemistryIcon from '$lib/assets/images/SkillLogo-Chemistry.svg?raw';
	import CommunicationSystemsIcon from '$lib/assets/images/SkillLogo-CommunicationSystems.svg?raw';
	import EcologieIcon from '$lib/assets/images/SkillLogo-Ecologie.svg?raw';
	import ElectricalEngineeringIcon from '$lib/assets/images/SkillLogo-ElectricalEngineering.svg?raw';
	import EngineeringIcon from '$lib/assets/images/SkillLogo-Engineering.svg?raw';
	import HistoricalAnalysisIcon from '$lib/assets/images/SkillLogo-HistoryicalAnalysis.svg?raw';
	import InformationTechnologyIcon from '$lib/assets/images/SkillLogo-InformationTechnology.svg?raw';
	import LifeSciencesIcon from '$lib/assets/images/SkillLogo-LifeSciences.svg?raw';
	import MechanicalEngineeringIcon from '$lib/assets/images/SkillLogo-MechanicalEngineering.svg?raw';
	import MedicalAndTraumaCareIcon from '$lib/assets/images/SkillLogo-MedicalAndTraumaCare.svg?raw';
	import SocialeWetenschapIcon from '$lib/assets/images/SkillLogo-SocialeWetenschap.svg?raw';
	import SocialogyAndDiplomacyIcon from '$lib/assets/images/SkillLogo-SocialogyAndDiplomacy.svg?raw';
	import SoftwareAndHackingIcon from '$lib/assets/images/SkillLogo-SoftwareAndHakcing.svg?raw';
	import Icon from './icon.svelte';
	import SegmentBar from './segment-bar.svelte';

	const GROUP_COLOR: Record<number, string> = {
		1: '#f0c040',
		2: '#4caf82',
		3: '#4a9edd',
		4: '#d95c5c'
	};

	const SKILL_ICONS: Record<string, string> = {
		engineering: EngineeringIcon,
		mechanicalengineering: MechanicalEngineeringIcon,
		electricalengineering: ElectricalEngineeringIcon,
		lifesciences: LifeSciencesIcon,
		chemistry: ChemistryIcon,
		ecologie: EcologieIcon,
		medicalandtraumacare: MedicalAndTraumaCareIcon,
		informationtechnology: InformationTechnologyIcon,
		softwarehacking: SoftwareAndHackingIcon,
		communicationsystems: CommunicationSystemsIcon,
		socialewetenschap: SocialeWetenschapIcon,
		historicalanalysis: HistoricalAnalysisIcon,
		sociologydiplomacy: SocialogyAndDiplomacyIcon
	};

	let {
		characterName,
		versionName,
		companyName,
		skills = [],
		items = [],
		implants = []
	}: {
		characterName: string;
		versionName?: string;
		companyName?: string | null;
		skills?: CharacterVersionSkill[];
		items?: CharacterVersionItem[];
		implants?: CharacterVersionImplant[];
	} = $props();

	const skillGroups = $derived.by(() => {
		const map = new Map<
			number,
			{ id: number; name: string; color: string; skills: CharacterVersionSkill[] }
		>();
		for (const skill of skills) {
			if (!map.has(skill.group)) {
				map.set(skill.group, {
					id: skill.group,
					name: skill.groupName,
					color: GROUP_COLOR[skill.group] ?? 'var(--color-accent)',
					skills: []
				});
			}
			map.get(skill.group)!.skills.push(skill);
		}
		return Array.from(map.values());
	});

	function getSkillIcon(name: string): string | undefined {
		const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
		const result = SKILL_ICONS[key];
		return result;
	}
</script>

<div class="character-version">
	<div class="header">
		<span class="character-name">{characterName}</span>
		{#if versionName}
			<span class="version-name">{versionName}</span>
		{/if}
		{#if companyName}
			<span class="company-name">{companyName}</span>
		{/if}
	</div>

	{#if skills.length > 0}
		<section class="section">
			<h4 class="section-label">skills</h4>
			<div class="skill-groups">
				{#each skillGroups as group (group.id)}
					<div class="group">
						<span class="group-name" style="color: {group.color}">{group.name}</span>
						<ul class="skill-list">
							{#each group.skills as skill (skill.id)}
								{@const icon = getSkillIcon(skill.name)}
								<li class="skill">
									{#if icon}
										<Icon src={icon} color={group.color} size="2rem" />
									{/if}
									<span class="skill-name">{skill.name}</span>
									<div class="skill-bar">
										<SegmentBar value={skill.value} color={group.color} />
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	{#if items.length > 0}
		<section class="section">
			<h4 class="section-label">items</h4>
			<ul class="entry-list">
				{#each items as item (item.id)}
					<li class="entry">
						<span class="entry-name">{item.name}</span>
						{#if item.description}
							<span class="entry-desc">{item.description}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if implants.length > 0}
		<section class="section">
			<h4 class="section-label">implants</h4>
			<ul class="entry-list">
				{#each implants as implant (implant.slot ?? implant.id)}
					<li class="entry">
						<span class="entry-name">{implant.name}</span>
						{#if implant.description}
							<span class="entry-desc">{implant.description}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.character-version {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.character-name {
		font-size: 1em;
		letter-spacing: 0.04em;
	}

	.version-name {
		font-size: 0.65em;
		opacity: 0.45;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.company-name {
		font-size: 0.65em;
		color: var(--color-accent);
		opacity: 0.7;
		letter-spacing: 0.05em;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.section-label {
		font-size: 0.6em;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.4;
		margin: 0;
		font-weight: normal;
	}

	.skill-groups {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		border-left: 2px solid currentColor;
		padding-left: 0.5rem;
	}

	.group-name {
		font-size: 0.6em;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.8;
	}

	.skill-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.skill {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.skill-name {
		flex: 1;
		font-size: 0.7em;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		min-width: 0;
	}

	.skill-bar {
		flex-shrink: 0;
		width: 7rem;
		pointer-events: none;
	}

	.entry-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.entry {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem 0.5rem;
		border: 1px solid color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	.entry-name {
		font-size: 0.75em;
		letter-spacing: 0.03em;
	}

	.entry-desc {
		font-size: 0.62em;
		opacity: 0.45;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
</style>
