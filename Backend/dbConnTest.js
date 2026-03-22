import { pool } from "./src/db/db.js";
async function testDB() {
    try {
        const [rows] = await pool.query("SELECT 1 + 1 AS result");
        console.log("DB Connected ", rows);
    } catch (err) {
        console.error("DB Error ", err);
    }
}

testDB();