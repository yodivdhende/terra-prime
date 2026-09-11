import type { implants } from '../../src/lib/db/schema';

export const rows: (typeof implants.$inferInsert)[] = [
	{
		id: 1,
		name: 'Combat Medic brons',
		description: '1 charge = 1 stervende persoon terug tot levend wekken. (1 charges)',
		cost: 150
	},
	{
		id: 2,
		name: 'Combat Medic zilver',
		description: '1 charge = 1 stervende persoon terug tot levend wekken. (3 charges)',
		cost: 200
	},
	{
		id: 3,
		name: 'Combat Medic gold',
		description: '1 charge = 1 stervende persoon terug tot levend wekken. (5 charges)',
		cost: 300
	},
	{ id: 4, name: 'Extra Prints brons', description: 'je krijgt 1 extra print', cost: 180 },
	{ id: 5, name: 'Extra Prints zilver', description: 'je krijgt 2 extra print', cost: 230 },
	{ id: 6, name: 'Extra Prints goud', description: 'je krijgt 3 extra print', cost: 330 },
	{ id: 7, name: 'Internal carapace brons', description: 'je mag 1 hit negeren', cost: 225 },
	{ id: 8, name: 'Internal carapace zilver', description: 'je mag 1 extra hit negeren', cost: 275 },
	{ id: 9, name: 'Internal carapace gold', description: 'je mag 1 extra hit negeren', cost: 375 },
	{
		id: 10,
		name: 'Local Reconstruction Protocal',
		description: 'Je mag 1 print gebruiken om terplaatse te printen',
		cost: 250
	},
	{
		id: 11,
		name: 'Virtuele recon',
		description:
			'Je kan van afde printer 20 secconden rond lopen zonder geraakt te worden. tijdens deze 20 seccond kan je zelf geen schade aan richten. Na de 20 secconden moet je rechtstreeks terug naar de printer gaan.',
		cost: 120
	}
];
