import mysql from 'mysql2/promise';

let mysqlconn: Promise<mysql.Connection> | null = null;

export function mysqlconnFn(): Promise<mysql.Connection> {

    if (!mysqlconn) {
        mysqlconn = mysql.createConnection({
            host: process.env.MYSQLHOST ?? 'localhost',
            port: parseInt(process.env.MYSQLPORT ?? '3307'),
            user: process.env.MYSQLUSER ?? 'yodi',
            password: process.env.MYSQLPASSWORD ?? 'Tester@123',
            database: process.env.MYSQLDATABASE ?? 'testaliceDB',
            namedPlaceholders: true,
        });
    }

    return mysqlconn;
}