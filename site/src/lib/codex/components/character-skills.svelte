<script lang="ts">
	import MechanicalEngineering from '$lib/assets/images/SkillLogo-MechanicalEngineering.svg?raw';
	import ElectricalEngineering from '$lib/assets/images/SkillLogo-ElectricalEngineering.svg?raw';
	import MedicalAndTraumaCare from '$lib/assets/images/SkillLogo-MedicalAndTraumaCare.svg?raw';
	import Chemistry from '$lib/assets/images/SkillLogo-Chemistry.svg?raw';
	import Ecologie from '$lib/assets/images/SkillLogo-Ecologie.svg?raw';
	import SoftwareAndHacking from '$lib/assets/images/SkillLogo-SoftwareAndHakcing.svg?raw';
	import CommunicationSystems from '$lib/assets/images/SkillLogo-CommunicationSystems.svg?raw';
	import HistoricalAnalysis from '$lib/assets/images/SkillLogo-HistoryicalAnalysis.svg?raw';
	import SociologyAndDiplomacy from '$lib/assets/images/SkillLogo-SocialogyAndDiplomacy.svg?raw';
	import Icon from '$lib/codex/components/icon.svelte';

	type Skill = {
		id: number;
		group: number;
		groupName: string;
		value: number;
	};

	let { skills, maxValue = 5 }: { skills: Skill[]; maxValue?: number } = $props();

	const SKILL_INFO: Record<number, { name: string; icon: string }> = {
		1: { name: 'Mechanical Engineering', icon: MechanicalEngineering },
		2: { name: 'Electrical Engineering', icon: ElectricalEngineering },
		3: { name: 'Medical & Trauma Care', icon: MedicalAndTraumaCare },
		4: { name: 'Chemistry', icon: Chemistry },
		5: { name: 'Ecologie', icon: Ecologie },
		6: { name: 'Software & Hacking', icon: SoftwareAndHacking },
		7: { name: 'Communication Systems', icon: CommunicationSystems },
		8: { name: 'Historical Analysis', icon: HistoricalAnalysis },
		9: { name: 'Sociology & Diplomacy', icon: SociologyAndDiplomacy }
	};

	const GROUP_COLOR: Record<number, string> = {
		1: '#f0c040',
		2: '#4caf82',
		3: '#4a9edd',
		4: '#d95c5c'
	};

	const groups = $derived.by(() => {
		const map = new Map<number, { id: number; name: string; color: string; skills: Skill[] }>();
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

	function dots(value: number, max: number): boolean[] {
		return Array.from({ length: max }, (_, i) => i < value);
	}
</script>

<div class="character-skills">
	{#each groups as group (group.id)}
		<div class="group" style="--group-color: {group.color}; border-left-color: {group.color}">
			<div class="group-header">
				<span class="group-name">{group.name}</span>
			</div>
			<ul class="skill-list">
				{#each group.skills as skill (skill.id)}
					{@const info = SKILL_INFO[skill.id]}
					<li class="skill">
						{#if info}
							<Icon src={info.icon} color={group.color} tooltip={info.name} size="1.1rem" />
							<span class="skill-name">{info.name}</span>
						{:else}
							<span class="skill-name skill-name--unknown">skill #{skill.id}</span>
						{/if}
						<div class="skill-value">
							<span class="value-number">{skill.value}</span>
							<span class="dots" aria-hidden="true">
								{#each dots(skill.value, maxValue) as filled}
									<span class="dot" class:filled></span>
								{/each}
							</span>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<style>
	.character-skills {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.group {
		border-left: 2px solid;
		padding-left: 0.6rem;
	}

	.group-header {
		margin-bottom: 0.35rem;
	}

	.group-name {
		font-size: 0.65em;
		font-weight: bold;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--group-color);
		opacity: 0.85;
	}

	.skill-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.skill {
		display: flex;
		align-items: center;
		gap: 0.45rem;
	}

	.skill-name {
		flex: 1;
		font-size: 0.7em;
		opacity: 0.8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.skill-name--unknown {
		opacity: 0.35;
		font-style: italic;
	}

	.skill-value {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.value-number {
		font-size: 0.65em;
		min-width: 1ch;
		text-align: right;
		opacity: 0.6;
		color: var(--group-color);
	}

	.dots {
		display: flex;
		gap: 2px;
	}

	.dot {
		width: 5px;
		height: 5px;
		border: 1px solid var(--group-color);
		opacity: 0.4;
	}

	.dot.filled {
		background-color: var(--group-color);
		opacity: 0.9;
	}
</style>
