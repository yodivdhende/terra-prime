import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, '..', 'drizzle');

/**
 * `drizzle/0000_baseline.sql` captures the schema as the 21 hand-written `db/migrations/*.sql`
 * files left it. Dev, staging, and production were all built by that old runner, so the baseline
 * must be recorded as applied on them rather than executed — running it would fail on the first
 * `CREATE TABLE`. Mirrors the bootstrap branch the old runner had for pre-`_migrations` databases.
 *
 * Detection uses the same probe the old runner used: if `Admins` exists, the schema is already
 * there. A genuinely empty database falls through and runs the baseline normally.
 */
async function bootstrapExistingDatabase(conn: mysql.Connection) {
	const [tables] = await conn.query<mysql.RowDataPacket[]>("SHOW TABLES LIKE 'Admins'");
	if (tables.length === 0) return;

	await conn.query(
		'CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (id serial primary key, hash text not null, created_at bigint)'
	);
	const [applied] = await conn.query<mysql.RowDataPacket[]>(
		'SELECT COUNT(*) AS count FROM `__drizzle_migrations`'
	);
	if (Number(applied[0].count) > 0) return;

	const [baseline] = readMigrationFiles({ migrationsFolder });
	if (baseline == null) return;

	await conn.query('INSERT INTO `__drizzle_migrations` (`hash`, `created_at`) VALUES (?, ?)', [
		baseline.hash,
		baseline.folderMillis
	]);
	console.log('[boot]  0000_baseline (tables already exist, marked as applied)');
}

async function run() {
	const conn = await mysql.createConnection({
		host: process.env.MYSQLHOST ?? 'localhost',
		port: parseInt(process.env.MYSQLPORT ?? '3307'),
		user: process.env.MYSQLUSER ?? 'yodi',
		password: process.env.MYSQLPASSWORD ?? 'Tester@123',
		database: process.env.MYSQLDATABASE ?? 'testaliceDB',
		multipleStatements: true
	});

	try {
		await bootstrapExistingDatabase(conn);
		const db = drizzle(conn);
		await migrate(db, { migrationsFolder });

		const [rows] = await conn.query<mysql.RowDataPacket[]>(
			'SELECT COUNT(*) AS count FROM `__drizzle_migrations`'
		);
		console.log(`Migrations complete. ${rows[0].count} applied.`);
	} finally {
		await conn.end();
	}
}

run().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
