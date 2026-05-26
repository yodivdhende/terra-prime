import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQLHOST ?? 'localhost',
    port: parseInt(process.env.MYSQLPORT ?? '3307'),
    user: process.env.MYSQLUSER ?? 'yodi',
    password: process.env.MYSQLPASSWORD ?? 'Tester@123',
    database: process.env.MYSQLDATABASE ?? 'testaliceDB',
    namedPlaceholders: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

export function mysqlconnFn(): mysql.Pool {
    return pool;
}
