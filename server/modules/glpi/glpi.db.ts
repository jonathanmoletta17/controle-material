import mysql from 'mysql2/promise';

if (!process.env.GLPI_DB_HOST || !process.env.GLPI_DB_USER) {
    console.warn("GLPI Database credentials not found. GLPI integration will be disabled.");
}

export const glpiPool = mysql.createPool({
    host: process.env.GLPI_DB_HOST,
    user: process.env.GLPI_DB_USER,
    password: process.env.GLPI_DB_PASS,
    database: process.env.GLPI_DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
