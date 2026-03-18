import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  try {
    const { rows } = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'items'");
    console.log("COLUMNS IN 'items':");
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColumns();
