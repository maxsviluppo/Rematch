import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL.replace('[', '').replace(']', ''),
});

async function setup() {
  try {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL");

    const sql = `
      -- 1. Items Table
      CREATE TABLE IF NOT EXISTS items (
          id SERIAL PRIMARY KEY,
          seller_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          location TEXT,
          category TEXT,
          image_url TEXT,
          status TEXT DEFAULT 'available',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 2. Requests Table
      CREATE TABLE IF NOT EXISTS requests (
          id SERIAL PRIMARY KEY,
          buyer_id TEXT NOT NULL,
          query TEXT NOT NULL,
          min_price DECIMAL(10,2) DEFAULT 0,
          max_price DECIMAL(10,2) DEFAULT 0,
          location TEXT,
          status TEXT DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Proposals Table
      CREATE TABLE IF NOT EXISTS proposals (
          id SERIAL PRIMARY KEY,
          request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
          item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
          status TEXT DEFAULT 'pending',
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 4. Favorites Table
      CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, item_id)
      );

      -- 5. Messages Table
      CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id TEXT NOT NULL,
          receiver_id TEXT NOT NULL,
          item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
          content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 6. Transactions Table
      CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          proposal_id INTEGER REFERENCES proposals(id) ON DELETE SET NULL,
          buyer_id TEXT,
          seller_id TEXT,
          item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
          status TEXT DEFAULT 'checkout',
          buyer_name TEXT,
          buyer_surname TEXT,
          buyer_email TEXT,
          buyer_phone TEXT,
          buyer_address TEXT,
          buyer_city TEXT,
          buyer_cap TEXT,
          tracking_id TEXT,
          courier TEXT,
          shipping_deadline TIMESTAMPTZ,
          shipped_at TIMESTAMPTZ,
          seller_iban TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Ensure RLS is handled (Supabase defaults to disabled, but we can enable if needed)
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'items' AND policyname = 'Allow all') THEN
              ALTER TABLE items ENABLE ROW LEVEL SECURITY;
              CREATE POLICY "Allow all" ON items FOR ALL USING (true) WITH CHECK (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'requests' AND policyname = 'Allow all') THEN
              ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
              CREATE POLICY "Allow all" ON requests FOR ALL USING (true) WITH CHECK (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Allow all') THEN
              ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
              CREATE POLICY "Allow all" ON proposals FOR ALL USING (true) WITH CHECK (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'favorites' AND policyname = 'Allow all') THEN
              ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
              CREATE POLICY "Allow all" ON favorites FOR ALL USING (true) WITH CHECK (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Allow all') THEN
              ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
              CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Allow all') THEN
              ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
              CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
          END IF;
      END
      $$;
    `;

    await client.query(sql);
    console.log("Tables created successfully on Supabase!");
    
  } catch (err) {
    console.error("Database setup error:", err);
  } finally {
    await client.end();
  }
}

setup();
