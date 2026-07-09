import { mysqlconnFn } from './mysql';

class PartyRepo {
	public async getAll(): Promise<Party[]> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(`
              SELECT
                  p.Id as id,
                  p.Name as name,
                  pm.Member as member
              FROM Party p
              JOIN Party_Members pm 
                  on pm.Party = p.Id
          `);
		if (Array.isArray(result) === false) return [];
		if (result.length === 0) return [];
		const parties: Party[] = [];
		for (const partyResult of result) {
			if (isPartyLine(partyResult)) {
				const existingParty = parties.find((party) => party.id === partyResult.id);
				if (existingParty) {
					existingParty.members.push(partyResult.member);
				} else {
					parties.push({
						id: partyResult.id,
						name: partyResult.name,
						members: [partyResult.member]
					});
				}
			} else
				console.error(`%c sql result is not party line`, `background:red;color:black`, {
					eventResult: partyResult
				});
		}
		return parties;
	}

	public save({ id, name, members }: Party) {
		if (id == null) return this.create({ name, members });
		return this.edit({ id, name, members });
	}

	public async create({ name, members }: Omit<Party, 'id'>) {
		const connection = mysqlconnFn();
		const partyId = await connection.execute(
			`
              INSERT INTO Party (Name)
              VALUES (?)
          `,
			[name]
		);
		if (typeof partyId !== 'number') return;
		const valueString = members.map((member) => `(${partyId}, ${member})`).join(',');
		await connection.execute(`
              INSERT INTO PARTY_Members (Party, Member)
              VALUES ${valueString}
              `);
	}

	public async edit(_party: Party) {
		// not yet implemented
	}

	public async delete({ id }: { id: number }) {
		const connection = mysqlconnFn();
		await connection.execute(
			`
              DELETE 
              FROM Party_Members  
              WHERE Party = ?
          `,
			[id]
		);
		await connection.execute(
			`
              DELETE 
              FROM Party
              WHERE Id = ?
          `,
			[id]
		);
	}

	public async getForCharacter({
		characterId
	}: {
		characterId: number;
	}): Promise<Party | undefined> {
		const connection = mysqlconnFn();
		const [result] = await connection.execute(
			`
              SELECT
                  p.Id as id,
                  p.Name as name,
                  pm.Member as member
              FROM Party p
              JOIN Party_Members pm 
                  on pm.Party = p.Id
              WHERE p.id in (
                  SELECT pm2.party
                  FROM Party_Members pm2
                  WHERE pm2.Member = ?
              )                
          `,
			[characterId]
		);
		if (Array.isArray(result) === false) return;
		if (result.length === 0) return;
		let partyResult: Party | undefined;
		for (const partyLine of result) {
			if (isPartyLine(partyLine)) {
				if (partyResult != null) {
					partyResult.members.push(partyLine.member);
				} else {
					partyResult = {
						id: partyLine.id,
						name: partyLine.name,
						members: [partyLine.member]
					};
				}
			} else
				console.error(`%c sql result is not party line`, `background:red;color:black`, {
					eventResult: partyLine
				});
		}
		return partyResult;
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

type PartyLine = {
	id: number;
	name: string;
	member: number;
};

export function isPartyLine(partyLine: unknown): partyLine is PartyLine {
	return (
		typeof partyLine === 'object' &&
		partyLine != null &&
		'name' in partyLine &&
		typeof partyLine.name === 'string' &&
		'member' in partyLine &&
		typeof partyLine.member === 'number' &&
		isNaN(partyLine.member) === false &&
		'id' in partyLine &&
		typeof partyLine.id === 'number'
	);
}
