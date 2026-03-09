require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔧 Initializing database...');
    const schema = fs.readFileSync(path.join(__dirname, '../config/schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
