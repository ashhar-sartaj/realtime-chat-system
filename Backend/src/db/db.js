// configuring mysql
import mysql from 'mysql2/promise.js'
import dotenv from 'dotenv'
dotenv.config();

export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,

    waitForConnections: true,
    connectionLimit: 10,
    //it is important to add ssl as false in order to properly cater to the db request from the frontend.. else it will throw ETIMEDOUT.
    ssl: {
        rejectUnauthorized: false
    }
    
})