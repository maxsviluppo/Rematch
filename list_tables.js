
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function listAllTables() {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables in public schema:");
    res.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    client.release();
  } catch (err) {
    console.error("Error listing tables:", err.message);
  } finally {
    await pool.end();
  }
}

listAllTables();
