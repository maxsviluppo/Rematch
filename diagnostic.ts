
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1 // Only one connection for diagnostics
});

const run = async () => {
    console.log("Starting DB diagnostics...");
    const start = Date.now();
    try {
        const client = await pool.connect();
        console.log(`Pool CONNECTED in ${Date.now() - start}ms`);
        const res = await client.query('SELECT NOW()');
        console.log(`Query SUCCESS: ${res.rows[0].now}`);
        client.release();
    } catch (e) {
        console.error("DIAGNOSTICS FAILED:", e);
    } finally {
        await pool.end();
    }
};

run();
