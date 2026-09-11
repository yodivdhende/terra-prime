import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as schema from '../src/lib/db/schema';
import { insertSeedData } from './seeds';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, '..', 'drizzle');

/**
 * Destructive by design, unchanged from the pre-Drizzle seeder: every table is dropped, the
 * migrations are replayed against the empty database, then the dev dataset is inserted. Foreign-key
 * checks stay off for the whole run because `Characters`, `Character_Versions`, and `Subco`
 * reference each other in a cycle no single insert ordering satisfies.
 */
async function seed() {
	const conn = await mysql.createConnection({
		host: process.env.MYSQLHOST ?? 'localhost',
		port: parseInt(process.env.MYSQLPORT ?? '3307'),
		user: process.env.MYSQLUSER ?? 'yodi',
		password: process.env.MYSQLPASSWORD ?? 'Tester@123',
		database: process.env.MYSQLDATABASE ?? 'testaliceDB',
		multipleStatements: true
	});

	try {
		await conn.query('SET FOREIGN_KEY_CHECKS=0');

		const [tables] = await conn.query<mysql.RowDataPacket[]>('SHOW TABLES');
		for (const row of tables) {
			const tableName = Object.values(row)[0] as string;
			await conn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
			console.log(`[drop] ${tableName}`);
		}

		const db = drizzle(conn, { schema, mode: 'default' });
		await migrate(db, { migrationsFolder });
		console.log('[migrate] schema rebuilt');

		await insertSeedData(db);

		console.log('Seeding complete.');
	} finally {
		await conn.query('SET FOREIGN_KEY_CHECKS=1');
		await conn.end();
	}
}

seed().catch((err) => {
	console.error('Seeding failed:', err);
	process.exit(1);
});
