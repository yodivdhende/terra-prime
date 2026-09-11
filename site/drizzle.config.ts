import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'mysql',
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dbCredentials: {
		host: process.env.MYSQLHOST ?? 'localhost',
		port: parseInt(process.env.MYSQLPORT ?? '3307'),
		user: process.env.MYSQLUSER ?? 'yodi',
		password: process.env.MYSQLPASSWORD ?? 'Tester@123',
		database: process.env.MYSQLDATABASE ?? 'testaliceDB'
	}
});
