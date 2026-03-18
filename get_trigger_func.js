import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getTriggerFunction() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user'");
    if (result.rows.length > 0) {
      console.log("Writing SOURCE to trigger_func_source.txt...");
      fs.writeFileSync('trigger_func_source.txt', result.rows[0].prosrc);
    } else {
      console.log("Function handle_new_user not found.");
    }
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
}

getTriggerFunction();
