import { mysqlconnFn } from "./mysql";

class PartyRepo {

	public async getAll(): Promise<Party[]> {
		try {
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
			for (let partyResult of result) {
				if (isPartyLine(partyResult)) {
                    const existingParty = parties.find(party => party.id === partyResult.id);
                    if(existingParty){
                        existingParty.members.push(partyResult.member);
                    }
                    else{
                        parties.push({
                           id: partyResult.id,
                           name: partyResult.name,
                           members: [partyResult.member],
                        })
                    }
                }
				else console.error(`%c sql result is not party line`, `background:red;color:black`, { eventResult: partyResult });
			}
			return parties;
		} catch (err) {
			throw err;
		}
	}
	
	public save({id, name, members}: Party) {
		if(id == null)	return this.create({name, members});
		return this.edit({id,name, members});
	}

	public async create({ name, members }: Omit<Party, 'id'>) {
		try {
			const connection = mysqlconnFn();
			const partyId = await connection.execute(
				`
                INSERT INTO Party (Name)
                VALUES (?)
            `,
				[name]
			);
            if(typeof partyId !== 'number') return;
            const valueString = members.map(member => `(${partyId}, ${member})`).join(',');
            await connection.execute(`
                INSERT INTO PARTY_Members (Party, Member)
                VALUES ${valueString}
                `)
		} catch (err) {
			throw err;
		}
	}

	public async edit({ id, name, members }: Party) {
		// try {
		// 	const connection = mysqlconnFn();
		// 	await connection.execute(
		// 		`
        //         UPDATE Events
        //         SET name = ?,
        //         StartTime = ?,
        //         EndTime = ?
        //         WHERE id = ?
        //     `,
		// 		[name, start, end, id]
		// 	);
		// } catch (err) {
		// 	throw err;
		// }
	}

	public async delete({id}: {id: number})  {
		try {
			const connection = mysqlconnFn();
			await connection.execute(`
                DELETE 
                FROM Party_Members  
                WHERE Party = ?
            `, [id]);
			await connection.execute(`
                DELETE 
                FROM Party
                WHERE Id = ?
            `, [id]);
		} catch (err) {
			throw err;
		}
	}
    
	public async getForCharacter({characterId}: {characterId: number}): Promise<Party | undefined> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
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
            `,[characterId]);
			if (Array.isArray(result) === false) return;
			if (result.length === 0) return;
			let partyResult: Party | undefined;
			for (let partyLine of result) {
				if (isPartyLine(partyLine)) {
                    if(partyResult != null){
                        partyResult.members.push(partyLine.member);
                    }
                    else{
                        partyResult = {
                           id: partyLine.id,
                           name: partyLine.name,
                           members: [partyLine.member],
                        }
                    }
                }
				else console.error(`%c sql result is not party line`, `background:red;color:black`, { eventResult: partyLine });
			}
			return partyResult;
		} catch (err) {
			throw err;
		}
	}
}

export type Party = {
    id: number | null;
    name: string;
    members: number[];
}

export function isParty(party: unknown): party is Party {
    return typeof party === "object"
    && party != null
    && 'name'in party
    && typeof party.name === 'string'
    && 'members'in party
    && Array.isArray(party.members)
    && party.members.every(member => typeof member === 'number' && isNaN(member) === false)
    && 'id' in party
    && (
        typeof party.id === 'number'
        || party.id === null
    )
}

type PartyLine = {
    id: number;
    name: string;
    member: number
 }

export function isPartyLine(partyLine: unknown): partyLine is PartyLine {
    return typeof partyLine === "object"
    && partyLine != null
    && 'name'in partyLine
    && typeof partyLine.name === 'string'
    && 'member'in partyLine
    && typeof partyLine.member === 'number'
    && isNaN(partyLine.member) === false
    && 'id' in partyLine
    &&typeof partyLine.id === 'number'

}


