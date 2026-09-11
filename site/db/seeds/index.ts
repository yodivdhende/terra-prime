import type { MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from '../../src/lib/db/schema';

import * as admins from './admins';
import * as characterVersionExpertise from './character_version_expertise';
import * as characterVersionImplants from './character_version_implants';
import * as characterVersionItems from './character_version_items';
import * as characterVersions from './character_versions';
import * as characters from './characters';
import * as companies from './companies';
import * as eventParticipants from './event_participants';
import * as events from './events';
import * as expertise from './expertise';
import * as expertiseGroups from './expertise_groups';
import * as expertisePointCosts from './expertise_point_costs';
import * as implants from './implants';
import * as items from './items';
import * as party from './party';
import * as partyMembers from './party_members';
import * as sessions from './sessions';
import * as users from './users';

type Db = MySql2Database<typeof schema>;

/**
 * Insert order is foreign-key safe top to bottom. `seed.ts` still disables FK checks around the
 * whole run because `Characters`, `Character_Versions`, and `Party` reference each other in a way
 * no single ordering satisfies during a full rebuild.
 */
export async function insertSeedData(db: Db) {
	const steps: { label: string; run: () => Promise<unknown> }[] = [
		{ label: 'users', run: () => db.insert(schema.users).values(users.rows) },
		{ label: 'admins', run: () => db.insert(schema.admins).values(admins.rows) },
		{ label: 'companies', run: () => db.insert(schema.companies).values(companies.rows) },
		{
			label: 'expertise_groups',
			run: () => db.insert(schema.expertiseGroups).values(expertiseGroups.rows)
		},
		{ label: 'expertise', run: () => db.insert(schema.expertise).values(expertise.rows) },
		{
			// Migration 0018 seeds a single breakpoint row; replace it wholesale, as the old
			// `expertise_point_costs.sql` did with its leading DELETE.
			label: 'expertise_point_costs',
			run: async () => {
				await db.delete(schema.expertisePointCosts);
				await db.insert(schema.expertisePointCosts).values(expertisePointCosts.rows);
			}
		},
		{ label: 'items', run: () => db.insert(schema.items).values(items.rows) },
		{ label: 'implants', run: () => db.insert(schema.implants).values(implants.rows) },
		{ label: 'characters', run: () => db.insert(schema.characters).values(characters.rows) },
		{
			label: 'character_versions',
			run: () => db.insert(schema.characterVersions).values(characterVersions.rows)
		},
		{
			label: 'character_version_expertise',
			run: () => db.insert(schema.characterVersionExpertise).values(characterVersionExpertise.rows)
		},
		{
			label: 'character_version_implants',
			run: () => db.insert(schema.characterVersionImplants).values(characterVersionImplants.rows)
		},
		{
			label: 'character_version_items',
			run: () => db.insert(schema.characterVersionItems).values(characterVersionItems.rows)
		},
		{ label: 'events', run: () => db.insert(schema.events).values(events.rows) },
		{
			label: 'event_participants',
			run: () => db.insert(schema.eventParticipants).values(eventParticipants.rows)
		},
		{ label: 'party', run: () => db.insert(schema.party).values(party.rows) },
		{ label: 'party_members', run: () => db.insert(schema.partyMembers).values(partyMembers.rows) },
		{
			label: 'sessions',
			run: async () => {
				await db.insert(schema.sessions).values(sessions.rows);
				await db.insert(schema.sessionRoles).values(sessions.roleRows);
			}
		}
	];

	for (const { label, run } of steps) {
		console.log(`[seed] ${label}`);
		await run();
		console.log(`[done] ${label}`);
	}
}
