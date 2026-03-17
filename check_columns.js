
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

async function checkExactColumns() {
  try {
    const client = await pool.connect();
    
    console.log("--- TRANSACTIONS COLUMNS ---");
    const resT = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions'");
    resT.rows.forEach(row => console.log(`'${row.column_name}'`));
    
    console.log("\n--- ITEMS COLUMNS ---");
    const resI = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'items'");
    resI.rows.forEach(row => console.log(`'${row.column_name}'`));
    
    client.release();
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

checkExactColumns();
