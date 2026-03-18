
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function removeUniqueConstraint() {
  try {
    const client = await pool.connect();
    console.log("Removing 'users_username_unique' index to allow multiple users with same name...");
    
    await client.query(`
      DROP INDEX IF EXISTS users_username_unique;
    `);
    
    console.log("✅ 'users_username_unique' dropped successfully.");
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR removing index:", err.message);
    process.exit(1);
  }
}

removeUniqueConstraint();
