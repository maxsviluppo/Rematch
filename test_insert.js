
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

async function testInsert() {
  try {
    const client = await pool.connect();
    
    // Get a test item and user
    const itemRes = await client.query("SELECT id, seller_id, title, price, category, image_url, images FROM items LIMIT 1");
    if (itemRes.rows.length === 0) {
      console.log("No items found to test with.");
      return;
    }
    const item = itemRes.rows[0];
    const buyer_id = 'test_buyer_id'; // Can be any text
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 5);

    const shipping_details = {
      name: 'Mario',
      surname: 'Rossi',
      email: 'mario.rossi@example.com',
      phone: '+39 333 1234567',
      address: 'Via Roma 123',
      city: 'Milano',
      cap: '20121'
    };

    console.log("Attempting to insert transaction...");
    
    const query = `
      INSERT INTO transactions (
        proposal_id, buyer_id, seller_id, item_id, 
        buyer_name, buyer_surname, buyer_email, buyer_phone, 
        buyer_address, buyer_city, buyer_cap, 
        shipping_deadline, status,
        title, price, category, image_url, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'paid', $13, $14, $15, $16, $17)
      RETURNING id
    `;
    
    const values = [
      null, buyer_id, item.seller_id, item.id,
      shipping_details.name, shipping_details.surname, shipping_details.email, shipping_details.phone,
      shipping_details.address, shipping_details.city, shipping_details.cap,
      deadline,
      item.title, item.price, item.category, item.image_url, JSON.stringify(item.images || [])
    ];

    const result = await client.query(query, values);
    console.log("Insert successful! ID:", result.rows[0].id);
    
    client.release();
  } catch (err) {
    console.error("INSERT ERROR:", err.message);
    if (err.detail) console.error("DETAIL:", err.detail);
    if (err.hint) console.error("HINT:", err.hint);
  } finally {
    await pool.end();
  }
}

testInsert();
