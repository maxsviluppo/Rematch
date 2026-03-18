
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAllTables() {
  try {
    const client = await pool.connect();
    console.log("FINAL CHECK OF ALL INDEXES ON 'users':");
    const result = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users' AND schemaname = 'public'
    `);
    result.rows.forEach(idx => console.log(`INDEX ${idx.indexname}: ${idx.indexdef}`));
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
}

checkAllTables();
