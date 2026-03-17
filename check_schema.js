
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

async function checkSchema() {
  try {
    const client = await pool.connect();
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transactions'
      ORDER BY ordinal_position;
    `);
    console.log("Columns in 'transactions' table:");
    res.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (Nullable: ${row.is_nullable})`);
    });
    client.release();
  } catch (err) {
    console.error("Error checking schema:", err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
