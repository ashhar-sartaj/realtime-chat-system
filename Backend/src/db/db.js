// configuring mysql
import mysql from 'mysql2/promise.js'
export const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'connect123',
    database: 'chat_app',
    waitForConnections: true,
    connectionLimit: 10
})