import mysql from 'mysql2/promise';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
    const conn = await mysql.createConnection({
        host: process.env.MYSQLHOST ?? 'localhost',
        port: parseInt(process.env.MYSQLPORT ?? '3307'),
        user: process.env.MYSQLUSER ?? 'yodi',
        password: process.env.MYSQLPASSWORD ?? 'Tester@123',
        database: process.env.MYSQLDATABASE ?? 'testaliceDB',
        multipleStatements: true,
    });

    try {
        await conn.execute(`
            CREATE TABLE IF NOT EXISTS \`_migrations\` (
                \`id\` INT NOT NULL AUTO_INCREMENT,
                \`filename\` VARCHAR(255) NOT NULL UNIQUE,
                \`applied_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`)
            )
        `);

        const [rows] = await conn.execute<mysql.RowDataPacket[]>(
            'SELECT `filename` FROM `_migrations`'
        );
        const applied = new Set(rows.map((r) => r.filename as string));

        const migrationsDir = join(__dirname, 'migrations');
        const files = (await readdir(migrationsDir))
            .filter((f) => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`[skip] ${file}`);
                continue;
            }

            console.log(`[run]  ${file}`);
            const sql = await readFile(join(migrationsDir, file), 'utf8');
            await conn.query(sql);
            await conn.execute('INSERT INTO `_migrations` (`filename`) VALUES (?)', [file]);
            console.log(`[done] ${file}`);
        }

        console.log('Migrations complete.');
    } finally {
        await conn.end();
    }
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
