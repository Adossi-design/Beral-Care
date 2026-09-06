const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// The database name and user come from the environment. The fallbacks below
// are the original names, kept so existing databases keep working after the
// app was renamed to Beral Care. Renaming a live database would only risk
// breaking a working deployment.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'beral_care',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'beral_care',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = pool;