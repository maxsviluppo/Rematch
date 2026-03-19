import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query('SELECT status, count(*) FROM items GROUP BY status');
    console.log('Item Statuses:', JSON.stringify(res.rows));
    
    // Also check first 5 items
    const res2 = await pool.query('SELECT title, status, seller_id FROM items LIMIT 5');
    console.log('Sample Items:', JSON.stringify(res2.rows));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

check();
