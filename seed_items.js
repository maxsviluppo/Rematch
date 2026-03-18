import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    console.log("Seeding started...");
    // Check if items exist
    const { rows } = await pool.query("SELECT COUNT(*) FROM items");
    console.log(`Current items: ${rows[0].count}`);

    if (parseInt(rows[0].count) === 0) {
      console.log("Starting insertion...");
      const items = [
        { seller_id: 'user_123', title: 'iPhone 15 Pro', description: 'Come nuovo, 256GB, Titanio Naturale', price: 950, location: 'Milano', category: 'Elettronica', image_url: 'https://picsum.photos/seed/iphone/400/400' },
        { seller_id: 'user_123', title: 'MacBook Air M2', description: '8GB RAM, 256GB SSD, Grigio Siderale', price: 850, location: 'Roma', category: 'Elettronica', image_url: 'https://picsum.photos/seed/macbook/400/400' },
        { seller_id: 'user_123', title: 'Sedia Ergonomica', description: 'Ottima per ufficio, regolabile', price: 120, location: 'Milano', category: 'Casa', image_url: 'https://picsum.photos/seed/chair/400/400' }
      ];

      for (const item of items) {
        console.log(`Inserting ${item.title}...`);
        await pool.query("INSERT INTO items (seller_id, title, description, price, location, category, image_url, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [
          item.seller_id, item.title, item.description, item.price, item.location, item.category, item.image_url, '[]'
        ]);
        console.log(`Inserted ${item.title}.`);
      }
      console.log("Seeding completed successfully");
    } else {
      console.log("Items already exist, skipping seed.");
    }
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
