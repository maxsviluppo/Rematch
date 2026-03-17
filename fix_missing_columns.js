
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

async function fixColumns() {
  try {
    const client = await pool.connect();
    console.log("Checking and fixing transactions table columns...");
    
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS title TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
    `);
    
    console.log("✅ Columns check/fix completed.");
    client.release();
  } catch (err) {
    console.error("❌ ERROR fixing columns:", err.message);
  } finally {
    await pool.end();
  }
}

fixColumns();
