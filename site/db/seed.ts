import mysql from 'mysql2/promise';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQLHOST ?? 'localhost',
        port: parseInt(process.env.MYSQLPORT ?? '3307'),
        user: process.env.MYSQLUSER ?? 'yodi',
        password: process.env.MYSQLPASSWORD ?? 'Tester@123',
        database: process.env.MYSQLDATABASE ?? 'testaliceDB',
        multipleStatements: true,
    });

    try {
        await conn.query('SET FOREIGN_KEY_CHECKS=0');

        const seedsDir = join(__dirname, 'seeds');
        const files = (await readdir(seedsDir))
            .filter((f) => f.endsWith('.sql'))
            .sort();

        // Drop all existing tables and reset migration tracking
        const [rows] = await conn.query<mysql.RowDataPacket[]>('SHOW TABLES');
        for (const row of rows) {
            const tableName = Object.values(row)[0] as string;
            await conn.query(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`[drop] ${tableName}`);
        }
        await conn.query('DROP TABLE IF EXISTS `_migrations`');

        // Re-run all migrations to recreate the schema
        const migrationsDir = join(__dirname, 'migrations');
        const migrationFiles = (await readdir(migrationsDir))
            .filter((f) => f.endsWith('.sql'))
            .sort();

        await conn.query(`
            CREATE TABLE \`_migrations\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`filename\` VARCHAR(255) NOT NULL UNIQUE,
                \`applied_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            )
        `);

        for (const file of migrationFiles) {
            console.log(`[migrate] ${file}`);
            const sql = await readFile(join(migrationsDir, file), 'utf8');
            await conn.query(sql);
            await conn.execute('INSERT INTO `_migrations` (`filename`) VALUES (?)', [file]);
        }

        // Insert seed data
        for (const file of files) {
            console.log(`[seed] ${file}`);
            const sql = await readFile(join(seedsDir, file), 'utf8');
            await conn.query(sql);
            console.log(`[done] ${file}`);
        }

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
