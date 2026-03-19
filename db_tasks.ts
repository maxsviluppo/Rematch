
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log("--- Starting Database Tasks ---");
  
  // 1. Add views_count to items if not exists
  try {
    console.log("Checking and adding views_count column...");
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0`);
    console.log("views_count column ensured.");
  } catch (e) {
    console.error("Error adding views_count:", e.message);
  }

  // 2. Perform Backup of today's data
  const date = new Date().toISOString().split('T')[0];
  const backupDir = path.join(process.cwd(), 'backups', date);
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const tables = ['items', 'favorites', 'users', 'transactions', 'proposals', 'requests', 'messages'];
  
  for (const table of tables) {
    try {
      console.log(`Backing up table: ${table}...`);
      const res = await pool.query(`SELECT * FROM ${table}`);
      const filePath = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(res.rows, null, 2));
      console.log(`Backup saved to ${filePath} (${res.rows.length} rows)`);
    } catch (e) {
      console.error(`Error backing up table ${table}:`, e.message);
    }
  }

  console.log("--- Database Tasks Completed ---");
  await pool.end();
}

run().catch(console.error);
