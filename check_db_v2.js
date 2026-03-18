
import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace('[', '').replace(']', ''),
  ssl: {
    rejectUnauthorized: false
  }
});

async function check() {
  try {
    await client.connect();
    console.log("Connected!");
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables:", res.rows.map(r => r.table_name));

    // Check column names for users table
    const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public'");
    console.log("Users Columns:", columns.rows.map(c => c.column_name));
    
    // Check if users table exists
    const usersTable = res.rows.find(r => r.table_name === 'users');
    if (usersTable) {
      const users = await client.query("SELECT * FROM users");
      console.log("Users in public.users Count:", users.rows.length);
      console.log("Users in public.users First 5:", users.rows.slice(0, 5));
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

check();
