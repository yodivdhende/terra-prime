import { mysqlconnFn } from './mysql';

class ItemRepo {
	public async getAll(): Promise<Item[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(`
        SELECT
          i.Id as id,
          i.Name as name,
          i.Description as description,
          i.Cost as cost,
          i.MaxPerCharacter as maxPerCharacter
        FROM Items i
        `);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const items: Item[] = [];
			for (let itemResult of result) {
				if (isItem(itemResult)) items.push(itemResult);
				else
					console.error(`%c sql result is not a item`, `background:red;color:black`, {
						itemResult
					});
			}
			return items;
		} catch (err) {
			throw err;
		}
	}

	public async getWithId(id: number) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
        SELECT
          i.Id as id,
          i.Name as name,
          i.Description as description,
          i.Cost as cost,
          i.MaxPerCharacter as maxPerCharacter
        FROM Items i
		WHERE i.Id = ?
        `,
				[id]
			);
			if (Array.isArray(result) === false) return null;
			if (result.length === 0) return null;
			const [item] = result;
			if (isItem(item) === false) return null;
			return item;
		} catch (err) {
			throw err;
		}
	}

	public async getWithIds(ids: number[]): Promise<Item[]> {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
        SELECT
          i.Id as id,
          i.Name as name,
          i.Description as description,
          i.Cost as cost,
          i.MaxPerCharacter as maxPerCharacter
        FROM Items i
        WHERE I.id in (:ids)
        `,
				{ ids }
			);
			if (Array.isArray(result) === false) return [];
			if (result.length === 0) return [];
			const items: Item[] = [];
			for (let itemResult of result) {
				if (isItem(itemResult)) items.push(itemResult);
				else
					console.error(`%c sql result is not a item`, `background:red;color:black`, {
						itemResult
					});
			}
			return items;
		} catch (err) {
			throw err;
		}
	}

	public save(item: Item) {
		if (item.id == null) return this.create(item);
		return this.edit(item);
	}

	public async saveBulk(items: Item[]) {
		const toCreate = items.filter((i) => i.id == null);
		const toUpdate = items.filter((i) => i.id != null);
		const conn = await mysqlconnFn().getConnection();
		try {
			await conn.beginTransaction();
			if (toCreate.length > 0) {
				const placeholders = toCreate.map(() => '(?,?,?,?)').join(',');
				const values = toCreate.flatMap((i) => [i.name, i.description, i.cost ?? 0, i.maxPerCharacter ?? null]);
				await conn.execute(
					`INSERT INTO Items (Name, Description, Cost, MaxPerCharacter) VALUES ${placeholders}`,
					values
				);
			}
			if (toUpdate.length > 0) {
				const placeholders = toUpdate.map(() => '(?,?,?,?,?)').join(',');
				const values = toUpdate.flatMap((i) => [i.id, i.name, i.description, i.cost ?? 0, i.maxPerCharacter ?? null]);
				await conn.execute(
					`INSERT INTO Items (Id, Name, Description, Cost, MaxPerCharacter) VALUES ${placeholders}
					 ON DUPLICATE KEY UPDATE Name=VALUES(Name), Description=VALUES(Description), Cost=VALUES(Cost), MaxPerCharacter=VALUES(MaxPerCharacter)`,
					values
				);
			}
			await conn.commit();
		} catch (err) {
			await conn.rollback();
			throw err;
		} finally {
			conn.release();
		}
	}

	public async create({ name, description, cost, maxPerCharacter }: Omit<Item, 'id'>) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				INSERT INTO Items (Name, Description, Cost, MaxPerCharacter)
				Values (?,?,?,?)
        `,
				[name, description, cost ?? 0, maxPerCharacter ?? null]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			if ('insertId' in result === false || result.insertId == null) return null;
			return result.insertId;
		} catch (err) {
			throw err;
		}
	}

	public async edit({ id, name, description, cost, maxPerCharacter }: Item) {
		try {
			const connection = mysqlconnFn();
			const [result] = await connection.execute(
				`
				UPDATE Items
				SET Name = ?,
				Description = ?,
				Cost = ?,
				MaxPerCharacter = ?
				WHERE Id = ?
        `,
				[name, description, cost ?? 0, maxPerCharacter ?? null, id]
			);
			if ('serverStatus' in result && result.serverStatus !== 2) return null;
			return id;
		} catch (err) {
			throw err;
		}
	}

	public async delete({ id }: { id: number }) {
		try {
			const connection = mysqlconnFn();
			await connection.execute(
				`
                DELETE 
                FROM Items 
                WHERE Id = ?
            `,
				[id]
			);
		} catch (err) {
			throw err;
		}
	}

}
export const itemRepo = new ItemRepo();

export type Item = {
	id: number | null;
	name: string;
	description: string;
	cost?: number;
	maxPerCharacter?: number | null;
};

export function isItem(item: unknown): item is Item {
	return (
		typeof item === 'object' &&
		item !== null &&
		'name' in item &&
		typeof item.name === 'string' &&
		'description' in item &&
		typeof item.description === 'string' &&
		'id' in item &&
		(typeof item.id === 'number' || item.id === null)
	);
}
