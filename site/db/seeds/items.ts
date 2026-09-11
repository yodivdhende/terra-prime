import type { items } from '../../src/lib/db/schema';

export const rows: (typeof items.$inferInsert)[] = [
	{ id: 1, name: 'Pillamp', description: 'je krijgt een zaklamp', cost: 20 },
	{
		id: 2,
		name: 'Close combat wapen',
		description: 'je krijgt een close combat wapen naar keuze',
		cost: 100
	},
	{
		id: 3,
		name: 'Kevlar',
		description: 'Je mag de eerst volgende hit negeren. Na het effect is dit item vernietigd',
		cost: 75
	},
	{
		id: 4,
		name: 'Kogel houder',
		description: 'Je mag 1 extra kogel magazine bij houden',
		cost: 50
	},
	{ id: 5, name: 'Hand wapen', description: 'Je krijgt 1 handwapen. (max 2)', cost: 125 },
	{ id: 6, name: 'Auto hand wapen', description: 'Je krijgt 1 automatiche handwapen', cost: 225 }
];
