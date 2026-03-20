import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1
});

async function check() {
  console.log("Checking Items in DB...");
  try {
    const res = await pool.query("SELECT id, title, status, seller_id FROM items LIMIT 10");
    console.log(`Successfully queried items. Count: ${res.rowCount}`);
    res.rows.forEach(r => console.log(`[${r.id}] ${r.title} - ${r.status}`));
  } catch (err: any) {
    console.error("DB Error Code:", err.code);
    console.error("DB Error message:", err.message);
  } finally {
    await pool.end();
  }
}
check();
