import { eq, inArray } from 'drizzle-orm';
import { db } from './mysql';
import { party, partyMembers } from './schema';

/** Collapses the one-row-per-member join result into one `Party` per party id. */
function groupPartyLines(lines: { id: number; name: string | null; member: number }[]): Party[] {
	const parties: Party[] = [];
	for (const line of lines) {
		const existing = parties.find((p) => p.id === line.id);
		if (existing) existing.members.push(line.member);
		else parties.push({ id: line.id, name: line.name ?? '', members: [line.member] });
	}
	return parties;
}

const partyLineColumns = {
	id: party.id,
	name: party.name,
	member: partyMembers.memberId
};

class PartyRepo {
	public async getAll(): Promise<Party[]> {
		const lines = await db
			.select(partyLineColumns)
			.from(party)
			.innerJoin(partyMembers, eq(partyMembers.partyId, party.id));
		return groupPartyLines(lines);
	}

	public save({ id, name, members }: Party) {
		if (id == null) return this.create({ name, members });
		return this.edit({ id, name, members });
	}

	public async create({ name, members }: Omit<Party, 'id'>) {
		await db.transaction(async (tx) => {
			const [result] = await tx.insert(party).values({ name });
			if (members.length === 0) return;
			await tx
				.insert(partyMembers)
				.values(members.map((memberId) => ({ partyId: result.insertId, memberId })));
		});
	}

	public async edit(_party: Party) {
		// not yet implemented
	}

	public async delete({ id }: { id: number }) {
		await db.transaction(async (tx) => {
			await tx.delete(partyMembers).where(eq(partyMembers.partyId, id));
			await tx.delete(party).where(eq(party.id, id));
		});
	}

	public async getForCharacter({
		characterId
	}: {
		characterId: number;
	}): Promise<Party | undefined> {
		const partyIds = db
			.select({ partyId: partyMembers.partyId })
			.from(partyMembers)
			.where(eq(partyMembers.memberId, characterId));

		const lines = await db
			.select(partyLineColumns)
			.from(party)
			.innerJoin(partyMembers, eq(partyMembers.partyId, party.id))
			.where(inArray(party.id, partyIds));

		return groupPartyLines(lines)[0];
	}
}

export const partyRepo = new PartyRepo();

export type Party = {
	id: number | null;
	name: string;
	members: number[];
};

export function isParty(party: unknown): party is Party {
	return (
		typeof party === 'object' &&
		party != null &&
		'name' in party &&
		typeof party.name === 'string' &&
		'members' in party &&
		Array.isArray(party.members) &&
		party.members.every((member) => typeof member === 'number' && isNaN(member) === false) &&
		'id' in party &&
		(typeof party.id === 'number' || party.id === null)
	);
}
