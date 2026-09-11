import type { expertise } from '../../src/lib/db/schema';
import { EXPERTISE_ICONS } from './expertise-icons.data';

const entries = [
	{
		id: 1,
		groupId: 1,
		name: 'Mechanical Engineering',
		description:
			'Expertise in het bouwen, repareren en onderhouden van mechanische constructies zoals motoren, wapens, machines en structuren.'
	},
	{
		id: 2,
		groupId: 1,
		name: 'Electrical Engineering',
		description:
			'Expertise in het installeren, repareren en manipuleren van elektrische systemen zoals stroomnetten, generators en elektronische toestellen.'
	},
	{
		id: 3,
		groupId: 2,
		name: 'Medical and Trauma Care',
		description:
			'Expertise in het behandelen van verwondingen en ziektes, van eerste hulp tot chirurgische ingrepen. Hiermee kan je diagnoses stellen, pati\u00ebnten stabiliseren en medische (mentale en fysieke) behandelingen uitvoeren.'
	},
	{
		id: 4,
		groupId: 2,
		name: 'Chemistry',
		description:
			'Expertise in het analyseren en manipuleren van chemische stoffen. Hiermee kan je medicatie ontwikkelen, onbekende substanties onderzoeken en toxines of chemische reacties identificeren.'
	},
	{
		id: 5,
		groupId: 2,
		name: 'Ecologie',
		description:
			'Kennis van flora, fauna en ecosystemen in natuurlijke omgevingen. Hiermee kan je dieren volgen, voedselbronnen herkennen en de natuur gebruiken om te overleven of informatie te verzamelen.'
	},
	{
		id: 6,
		groupId: 3,
		name: 'Software & Hacking',
		description:
			'Expertise in het analyseren, programmeren en manipuleren van computersystemen. Hiermee kan je software ontwikkelen, beveiligingen doorbreken en digitale systemen aanpassen of herstellen.'
	},
	{
		id: 7,
		groupId: 3,
		name: 'Communication Systems',
		description:
			'Expertise in elektronische communicatie en netwerktechnologie. Hiermee kan je radiosignalen, communicatienetwerken en dataverbindingen installeren, analyseren en gebruiken.'
	},
	{
		id: 8,
		groupId: 4,
		name: 'Historical Analysis',
		description:
			'Expertise in geschiedenis en geografische context van werelden en beschavingen. Hiermee kan je gebeurtenissen uit het verleden analyseren en verbanden leggen die helpen om de huidige situatie te begrijpen.'
	},
	{
		id: 9,
		groupId: 4,
		name: 'Sociology & Diplomacy',
		description:
			'Expertise in samenlevingen, culturen en politieke structuren. Hiermee kan je facties, volkeren en machtsverhoudingen beter begrijpen en diplomatieke situaties analyseren.'
	}
];

/** Icons are folded in here; the pre-Drizzle seeder applied them as a later UPDATE pass. */
export const rows: (typeof expertise.$inferInsert)[] = entries.map((entry) => ({
	...entry,
	icon: EXPERTISE_ICONS[entry.id] ?? null
}));
