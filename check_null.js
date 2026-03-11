import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'users' AND table_schema = 'public';
  `);
  console.log('Columns and nullability:');
  console.table(res.rows);
  await client.end();
}
run();
