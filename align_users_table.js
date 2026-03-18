
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function alignUsersTable() {
  try {
    const client = await pool.connect();
    console.log("Aligning 'users' table with code expectations...");
    
    // 1. Make email nullable if it's not (optional, but code doesn't strictly provide it everywhere)
    // Actually, it's better to keep it but match the NOT NULL if we have it
    
    // 2. Check if 'nickname' exists and 'nome' exists.
    // In our actual DB, 'nickname' is NOT NULL.
    // We should probably rename 'nickname' to 'nome' if 'nome' is what the code uses, 
    // or just make 'nickname' nullable.
    
    await client.query(`
      ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
      ALTER TABLE users ALTER COLUMN nickname DROP NOT NULL;
      -- Ensure 'nome' and 'username' exist (they should, but just in case)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS nome TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
    `);
    
    console.log("✅ 'users' table aligned successfully.");
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR aligning table:", err.message);
    process.exit(1);
  }
}

alignUsersTable();
