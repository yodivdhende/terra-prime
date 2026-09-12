/**
 * Mission name generator for the "Generate" button on the mission form.
 * Purely in-memory: nothing is persisted and nothing is checked for
 * uniqueness -- the generated name only seeds a still-editable field.
 */

const ADJECTIVES = [
	'Ashen',
	'Binary',
	'Blackout',
	'Broken',
	'Burning',
	'Cobalt',
	'Cold',
	'Crimson',
	'Dead',
	'Drifting',
	'Empty',
	'Fractured',
	'Frozen',
	'Ghost',
	'Gilded',
	'Hollow',
	'Iron',
	'Last',
	'Molten',
	'Neon',
	'Obsidian',
	'Pale',
	'Quiet',
	'Rusted',
	'Salted',
	'Scorched',
	'Severed',
	'Silent',
	'Static',
	'Stolen',
	'Sunken',
	'Tangled',
	'Violet',
	'Wandering',
	'Wired'
] as const;

const NOUNS = [
	'Anchor',
	'Archive',
	'Beacon',
	'Bulkhead',
	'Cascade',
	'Circuit',
	'Compass',
	'Conduit',
	'Cradle',
	'Current',
	'Dispatch',
	'Echo',
	'Ember',
	'Engine',
	'Foundry',
	'Fracture',
	'Harbour',
	'Horizon',
	'Lantern',
	'Ledger',
	'Lattice',
	'Meridian',
	'Monolith',
	'Orbit',
	'Outpost',
	'Relay',
	'Reactor',
	'Signal',
	'Spire',
	'Terminal',
	'Threshold',
	'Tide',
	'Vault',
	'Vector',
	'Wake'
] as const;

function pick<T>(values: readonly T[]): T {
	return values[Math.floor(Math.random() * values.length)];
}

export function generateMissionName(): string {
	return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}
