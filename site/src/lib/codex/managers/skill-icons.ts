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

export const GROUP_COLORS: Record<number, string> = {
	1: '#f0c040',
	2: '#4caf82',
	3: '#4a9edd',
	4: '#d95c5c'
};

export const GROUP_ICONS: Record<number, string> = {
	1: EngineeringIcon,
	2: LifeSciencesIcon,
	3: InformationTechnologyIcon,
	4: SocialeWetenschapIcon
};

export const SKILL_INFO: Record<number, { name: string; icon: string }> = {
	1: { name: 'Mechanical Engineering', icon: MechanicalEngineeringIcon },
	2: { name: 'Electrical Engineering', icon: ElectricalEngineeringIcon },
	3: { name: 'Medical & Trauma Care', icon: MedicalAndTraumaCareIcon },
	4: { name: 'Chemistry', icon: ChemistryIcon },
	5: { name: 'Ecologie', icon: EcologieIcon },
	6: { name: 'Software & Hacking', icon: SoftwareAndHackingIcon },
	7: { name: 'Communication Systems', icon: CommunicationSystemsIcon },
	8: { name: 'Historical Analysis', icon: HistoricalAnalysisIcon },
	9: { name: 'Sociology & Diplomacy', icon: SocialogyAndDiplomacyIcon }
};

const SKILL_ICONS_BY_NAME: Record<string, string> = {
	...Object.fromEntries(
		Object.values(SKILL_INFO).map((info) => [
			info.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
			info.icon
		])
	),
	engineering: EngineeringIcon,
	lifesciences: LifeSciencesIcon,
	informationtechnology: InformationTechnologyIcon,
	socialewetenschap: SocialeWetenschapIcon
};

export function getSkillIcon(name: string): string | undefined {
	return SKILL_ICONS_BY_NAME[name.toLowerCase().replace(/[^a-z0-9]/g, '')];
}
