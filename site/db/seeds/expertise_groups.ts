import type { expertiseGroups } from '../../src/lib/db/schema';
import { EXPERTISE_GROUP_COLORS, EXPERTISE_GROUP_ICONS } from './expertise-icons.data';

const groups = [
	{
		id: 1,
		name: 'Engineering',
		description:
			'Technische kennis voor het bouwen, repareren en onderhouden van mechanische en elektrische systemen.'
	},
	{
		id: 2,
		name: 'Life Sciences',
		description:
			'Wetenschappelijke kennis van het menselijk lichaam, chemische stoffen en natuurlijke omgevingen.'
	},
	{
		id: 3,
		name: 'Information Technology',
		description:
			'Digitale expertise in het analyseren, programmeren en beheren van computersystemen en communicatienetwerken.'
	},
	{
		id: 4,
		name: 'Sociale wetenschap',
		description:
			'Kennis van geschiedenis, samenlevingen en politieke structuren om de wereld en haar facties te begrijpen.'
	}
];

/** Icons and colours are folded in here; the pre-Drizzle seeder applied them as a later UPDATE pass. */
export const rows: (typeof expertiseGroups.$inferInsert)[] = groups.map((group) => ({
	...group,
	icon: EXPERTISE_GROUP_ICONS[group.id] ?? null,
	color: EXPERTISE_GROUP_COLORS[group.id] ?? null
}));
