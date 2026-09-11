import mysql from 'mysql2/promise';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import * as schema from './schema';

const pool = mysql.createPool({
	host: process.env.MYSQLHOST ?? 'localhost',
	port: parseInt(process.env.MYSQLPORT ?? '3307'),
	user: process.env.MYSQLUSER ?? 'yodi',
	password: process.env.MYSQLPASSWORD ?? 'Tester@123',
	database: process.env.MYSQLDATABASE ?? 'testaliceDB',
	namedPlaceholders: true,
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

/** The typed Drizzle client. Every repository goes through this. */
export const db = drizzle(pool, { schema, mode: 'default' });

export type Database = MySql2Database<typeof schema>;
