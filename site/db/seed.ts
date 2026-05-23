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

        for (const file of files) {
            const tableName = file
                .replace('.sql', '')
                .split('_')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join('_');
            try {
                await conn.query(`TRUNCATE TABLE \`${tableName}\``);
            } catch {
                console.log(`[skip truncate] ${tableName} (table not found)`);
            }
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
