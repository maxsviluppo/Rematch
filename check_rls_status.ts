import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname IN ('items', 'transactions', 'proposals', 'requests', 'favorites', 'users')
    `);
    console.log('RLS Status:', JSON.stringify(res.rows));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
