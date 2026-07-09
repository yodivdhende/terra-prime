import ChemistryIcon from '$lib/assets/images/ExpertiseLogo-Chemistry.svg?raw';
import CommunicationSystemsIcon from '$lib/assets/images/ExpertiseLogo-CommunicationSystems.svg?raw';
import EcologieIcon from '$lib/assets/images/ExpertiseLogo-Ecologie.svg?raw';
import ElectricalEngineeringIcon from '$lib/assets/images/ExpertiseLogo-ElectricalEngineering.svg?raw';
import EngineeringIcon from '$lib/assets/images/ExpertiseLogo-Engineering.svg?raw';
import HistoricalAnalysisIcon from '$lib/assets/images/ExpertiseLogo-HistoryicalAnalysis.svg?raw';
import InformationTechnologyIcon from '$lib/assets/images/ExpertiseLogo-InformationTechnology.svg?raw';
import LifeSciencesIcon from '$lib/assets/images/ExpertiseLogo-LifeSciences.svg?raw';
import MechanicalEngineeringIcon from '$lib/assets/images/ExpertiseLogo-MechanicalEngineering.svg?raw';
import MedicalAndTraumaCareIcon from '$lib/assets/images/ExpertiseLogo-MedicalAndTraumaCare.svg?raw';
import SocialeWetenschapIcon from '$lib/assets/images/ExpertiseLogo-SocialeWetenschap.svg?raw';
import SocialogyAndDiplomacyIcon from '$lib/assets/images/ExpertiseLogo-SocialogyAndDiplomacy.svg?raw';
import SoftwareAndHackingIcon from '$lib/assets/images/ExpertiseLogo-SoftwareAndHakcing.svg?raw';

/**
 * The bundled logos offered as quick-pick presets in the icon picker. Icons and
 * group colours now live in the database (`Expertise.Icon`, `Expertise_Groups.Icon`
 * / `Expertise_Groups.Color`); these presets are only a convenience for the admin
 * forms — every read surface renders the icon/colour stored on the row itself.
 */
export const ICON_PRESETS: { name: string; svg: string }[] = [
	{ name: 'Engineering', svg: EngineeringIcon },
	{ name: 'Mechanical Engineering', svg: MechanicalEngineeringIcon },
	{ name: 'Electrical Engineering', svg: ElectricalEngineeringIcon },
	{ name: 'Life Sciences', svg: LifeSciencesIcon },
	{ name: 'Medical & Trauma Care', svg: MedicalAndTraumaCareIcon },
	{ name: 'Chemistry', svg: ChemistryIcon },
	{ name: 'Ecologie', svg: EcologieIcon },
	{ name: 'Information Technology', svg: InformationTechnologyIcon },
	{ name: 'Software & Hacking', svg: SoftwareAndHackingIcon },
	{ name: 'Communication Systems', svg: CommunicationSystemsIcon },
	{ name: 'Sociale Wetenschap', svg: SocialeWetenschapIcon },
	{ name: 'Historical Analysis', svg: HistoricalAnalysisIcon },
	{ name: 'Sociology & Diplomacy', svg: SocialogyAndDiplomacyIcon }
];
