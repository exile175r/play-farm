const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mysql = require("mysql2/promise");

const config = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "play_farm",
    charset: "utf8mb4",
};

async function checkEvents() {
    let connection;
    try {
        connection = await mysql.createConnection(config);
        const [rows] = await connection.query("SELECT id, title, subtitle, status FROM events");
        console.log("Events in DB:", rows);
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.end();
    }
}
checkEvents();
