// config/db.config.js
const sql = require("mssql");
require("dotenv").config();

/**
 * SQL Server configuration
 * Hỗ trợ dev / production, logging, connection pool
 */
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),

  options: {
    encrypt: false,               // true nếu dùng Azure
    trustServerCertificate: true  // tránh lỗi SSL local
  },

  pool: {
    max: 10,   // số kết nối tối đa
    min: 0,
    idleTimeoutMillis: 30000
  },

  connectionTimeout: 15000,
  requestTimeout: 30000
};

let pool = null;

/**
 * Kết nối SQL Server (Singleton)
 */
async function getConnection() {
  try {
    if (pool) {
      return pool; // đã kết nối thì dùng lại
    }

    pool = await sql.connect(config);
    console.log("=======================================");
    console.log("✅ SQL Server Connected Successfully");
    console.log(`📌 Server: ${config.server}`);
    console.log(`📌 Database: ${config.database}`);
    console.log(`📌 Port: ${config.port}`);
    console.log("=======================================");

    return pool;
  } catch (err) {
    console.error("❌ SQL Connection Error");
    console.error("👉 Config:", config);
    console.error(err.message);
    throw err;
  }
}

/**
 * Đóng kết nối DB (khi shutdown server)
 */
async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log("🔌 SQL Connection Closed");
    }
  } catch (err) {
    console.error("❌ Error closing SQL connection:", err.message);
  }
}

module.exports = {
  sql,
  getConnection,
  closeConnection,
  config
};
