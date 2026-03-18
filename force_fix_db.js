import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function forceFix() {
  try {
    console.log("Forcing RLS disable and checking schema...");
    await pool.query("ALTER TABLE items DISABLE ROW LEVEL SECURITY");
    await pool.query("ALTER TABLE requests DISABLE ROW LEVEL SECURITY");
    await pool.query("ALTER TABLE proposals DISABLE ROW LEVEL SECURITY");
    await pool.query("ALTER TABLE favorites DISABLE ROW LEVEL SECURITY");
    await pool.query("ALTER TABLE users DISABLE ROW LEVEL SECURITY");
    await pool.query("ALTER TABLE messages DISABLE ROW LEVEL SECURITY");
    await pool.query("ALTER TABLE transactions DISABLE ROW LEVEL SECURITY");
    
    // Grant select to anon
    await pool.query("GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon");
    await pool.query("GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated");

    console.log("Success! RLS disabled and permissions granted.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

forceFix();
