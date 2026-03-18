import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLocks() {
  try {
    console.log("Checking for active locks and long queries...");
    const { rows } = await pool.query(`
      SELECT pid, now() - query_start as duration, query, state 
      FROM pg_stat_activity 
      WHERE state != 'idle' AND now() - query_start > interval '5 seconds'
    `);
    console.log(rows);
    
    if (rows.length > 0) {
      console.log("Found long running queries. Attempting to terminate them...");
      for (const row of rows) {
          if (row.pid !== process.pid) {
              await pool.query("SELECT pg_terminate_backend($1)", [row.pid]);
              console.log(`Terminated PID ${row.pid}`);
          }
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLocks();
