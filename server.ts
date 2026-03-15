import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Database (Schema should be created in Supabase dashboard or via initial migration)
async function initDb() {
  try {
    const client = await pool.connect();
    
    // 1. Create items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        seller_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        location TEXT,
        category TEXT,
        image_url TEXT,
        status TEXT DEFAULT 'available', -- available, sold, archived
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Create requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        buyer_id TEXT NOT NULL,
        query TEXT NOT NULL,
        min_price DECIMAL(10,2) DEFAULT 0,
        max_price DECIMAL(10,2) DEFAULT 0,
        location TEXT,
        status TEXT DEFAULT 'active', -- active, completed, cancelled
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Create proposals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id SERIAL PRIMARY KEY,
        request_id INTEGER REFERENCES requests(id),
        item_id INTEGER REFERENCES items(id),
        status TEXT DEFAULT 'pending', -- pending, accepted, rejected, expired
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Create favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        item_id INTEGER REFERENCES items(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Create messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id TEXT NOT NULL,
        receiver_id TEXT NOT NULL,
        item_id INTEGER REFERENCES items(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Create transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        proposal_id INTEGER REFERENCES proposals(id),
        buyer_id TEXT,
        seller_id TEXT,
        item_id INTEGER REFERENCES items(id),
        status TEXT DEFAULT 'checkout', -- checkout, paid, shipping, shipped, delivered, completed, cancelled
        
        -- Buyer Shipping Info
        buyer_name TEXT,
        buyer_surname TEXT,
        buyer_email TEXT,
        buyer_phone TEXT,
        buyer_address TEXT,
        buyer_city TEXT,
        buyer_cap TEXT,
        
        -- Shipping Data
        tracking_id TEXT,
        courier TEXT,
        shipping_deadline TIMESTAMPTZ,
        shipped_at TIMESTAMPTZ,
        
        -- Payout Info
        seller_iban TEXT,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    client.release();
    console.log("SUCCESS: Connected to Supabase PostgreSQL and ensured schema exists");
  } catch (err: any) {
    console.error("DATABASE INITIALIZATION ERROR:", err.message || err);
    console.error("Connection config host:", 'db.lydfzgzvxrayytzjgbmz.supabase.co');
  }
}

initDb();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    }
  });
  const PORT = 3007;

  // Socket.io connection handling
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} connected and joined room`);
    }

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Serve static files from the public folder
  app.use(express.static(path.join(__dirname, "public")));

  // API Routes
  app.get("/api/items", async (req, res) => {
    try {
      const { q, category } = req.query;
      let query = "SELECT * FROM items WHERE status = 'available'";
      const params: any[] = [];

      if (q) {
        query += " AND (title ILIKE $1 OR description ILIKE $2)";
        params.push(`%${q}%`, `%${q}%`);
      }

      if (category && category !== 'All' && category !== 'Tutte') {
        const paramIdx = params.length + 1;
        query += ` AND category = $${paramIdx}`;
        params.push(category);
      }

      query += " ORDER BY created_at DESC";
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const { seller_id, title, description, price, location, image_url, category } = req.body;
      if (!title || !price) {
        return res.status(400).json({ error: "Titolo e prezzo sono obbligatori" });
      }
      const result = await pool.query(
        "INSERT INTO items (seller_id, title, description, price, location, image_url, category) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [seller_id, title, description, price, location, image_url, category]
      );
      
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      console.error("Error creating item:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/requests/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await pool.query("SELECT * FROM requests WHERE buyer_id = $1 ORDER BY created_at DESC", [userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/requests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM requests WHERE id = $1", [id]);
      await pool.query("DELETE FROM proposals WHERE request_id = $1", [id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const { buyer_id, query, min_price, max_price, location } = req.body;
      const result = await pool.query(
        "INSERT INTO requests (buyer_id, query, min_price, max_price, location) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [buyer_id, query, min_price, max_price, location]
      );
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/proposals/:buyer_id", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT p.id as proposal_id, p.status, p.expires_at, p.request_id, p.item_id,
               i.title, i.description, i.price, i.location, i.image_url 
        FROM proposals p
        JOIN items i ON p.item_id = i.id
        JOIN requests r ON p.request_id = r.id
        WHERE r.buyer_id = $1 AND p.status = 'pending'
      `, [req.params.buyer_id]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transactions API
  app.post("/api/transactions", async (req, res) => {
    try {
      const { proposal_id, buyer_id, seller_id, item_id, shipping_details } = req.body;
      
      // Calculate 5 days deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      const result = await pool.query(`
        INSERT INTO transactions (
          proposal_id, buyer_id, seller_id, item_id, 
          buyer_name, buyer_surname, buyer_email, buyer_phone, 
          buyer_address, buyer_city, buyer_cap, 
          shipping_deadline, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'paid')
        RETURNING id
      `, [
        proposal_id, buyer_id, seller_id, item_id,
        shipping_details.name, shipping_details.surname, shipping_details.email, shipping_details.phone,
        shipping_details.address, shipping_details.city, shipping_details.cap,
        deadline
      ]);

      // Update proposal status
      await pool.query("UPDATE proposals SET status = 'accepted' WHERE id = $1", [proposal_id]);
      // Update item status
      await pool.query("UPDATE items SET status = 'sold' WHERE id = $1", [item_id]);

      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await pool.query(`
        SELECT t.*, i.title, i.price, i.image_url 
        FROM transactions t
        JOIN items i ON t.item_id = i.id
        WHERE t.buyer_id = $1 OR t.seller_id = $2
        ORDER BY t.created_at DESC
      `, [userId, userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions/:id/ship", async (req, res) => {
    try {
      const { id } = req.params;
      const { tracking_id, courier, seller_iban } = req.body;
      
      await pool.query(`
        UPDATE transactions SET 
          tracking_id = $1, 
          courier = $2, 
          seller_iban = $3,
          shipped_at = NOW(),
          status = 'shipped'
        WHERE id = $4
      `, [tracking_id, courier, seller_iban, id]);

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions/:id/confirm-arrival", async (req, res) => {
    try {
      await pool.query("UPDATE transactions SET status = 'delivered', updated_at = NOW() WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Messages API
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await pool.query(`
        SELECT * FROM messages 
        WHERE sender_id = $1 OR receiver_id = $2 
        ORDER BY created_at ASC
      `, [userId, userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { sender_id, receiver_id, item_id, content } = req.body;
      const result = await pool.query(
        "INSERT INTO messages (sender_id, receiver_id, item_id, content) VALUES ($1, $2, $3, $4) RETURNING id",
        [sender_id, receiver_id, item_id, content]
      );
      
      // Notify receiver
      io.to(receiver_id).emit("notification", {
        type: "new_message",
        title: "Nuovo Messaggio",
        body: `Hai ricevuto un nuovo messaggio: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
        data: { sender_id, item_id }
      });

      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Favorites API
  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await pool.query(`
        SELECT items.* FROM items 
        JOIN favorites ON items.id = favorites.item_id 
        WHERE favorites.user_id = $1
      `, [userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const { userId, itemId } = req.body;
      await pool.query("INSERT INTO favorites (user_id, item_id) VALUES ($1, $2)", [userId, itemId]);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Already favorited or error" });
    }
  });

  app.delete("/api/favorites/:userId/:itemId", async (req, res) => {
    try {
      const { userId, itemId } = req.params;
      await pool.query("DELETE FROM favorites WHERE user_id = $1 AND item_id = $2", [userId, itemId]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seed endpoint for testing
  app.post("/api/debug/seed", async (req, res) => {
    try {
      // Clear existing data
      await pool.query("DELETE FROM proposals");
      await pool.query("DELETE FROM items");
      await pool.query("DELETE FROM requests");

      // Insert test items
      const items = [
        { seller_id: 'user_123', title: 'iPhone 15 Pro', description: 'Come nuovo, 256GB, Titanio Naturale', price: 950, location: 'Milano', category: 'Elettronica', image_url: 'https://picsum.photos/seed/iphone/400/400' },
        { seller_id: 'user_123', title: 'MacBook Air M2', description: '8GB RAM, 256GB SSD, Grigio Siderale', price: 850, location: 'Roma', category: 'Elettronica', image_url: 'https://picsum.photos/seed/macbook/400/400' },
        { seller_id: 'user_123', title: 'Sedia Ergonomica', description: 'Ottima per ufficio, regolabile', price: 120, location: 'Milano', category: 'Casa', image_url: 'https://picsum.photos/seed/chair/400/400' }
      ];

      for (const item of items) {
        await pool.query("INSERT INTO items (seller_id, title, description, price, location, category, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
          item.seller_id, item.title, item.description, item.price, item.location, item.category, item.image_url
        ]);
      }

      // Insert test requests
      const requests = [
        { buyer_id: 'user_123', query: 'iphone', min_price: 500, max_price: 1200, location: 'Milano' },
        { buyer_id: 'user_123', query: 'sedia ufficio', min_price: 50, max_price: 200, location: 'Milano' }
      ];

      for (const req_data of requests) {
        await pool.query("INSERT INTO requests (buyer_id, query, min_price, max_price, location) VALUES ($1, $2, $3, $4, $5)", [
          req_data.buyer_id, req_data.query, req_data.min_price, req_data.max_price, req_data.location
        ]);
      }

      res.json({ success: true, message: "Database seeded with test data" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint to check DB state
  app.get("/api/debug/db", async (req, res) => {
    try {
      const items = (await pool.query("SELECT * FROM items")).rows;
      const requests = (await pool.query("SELECT * FROM requests")).rows;
      const proposals = (await pool.query("SELECT * FROM proposals")).rows;
      res.json({ items, requests, proposals });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Improved Matchmaking Endpoint
  app.post("/api/match", async (req, res) => {
    try {
      const activeRequests = (await pool.query("SELECT * FROM requests WHERE status = 'active'")).rows;
      const availableItems = (await pool.query("SELECT * FROM items WHERE status = 'available'")).rows;
      
      let matchesCreated = 0;
      console.log(`Starting match for ${activeRequests.length} requests and ${availableItems.length} items`);
      for (const request of activeRequests) {
        const queryLower = (request.query || "").toLowerCase().trim();
        if (!queryLower) continue;

        const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 0);
        console.log(`Checking request: "${queryLower}" (ID: ${request.id})`);
        
        for (const item of availableItems) {
          const titleLower = (item.title || "").toLowerCase();
          const descLower = (item.description || "").toLowerCase();
          console.log(`  Against item: "${item.title}" (ID: ${item.id})`);
          
          // 1. Price check - handle NaN, null, 0
          const minP = (request.min_price !== null && !isNaN(request.min_price)) ? request.min_price : 0;
          const maxP = (request.max_price !== null && !isNaN(request.max_price) && request.max_price > 0) ? request.max_price : Infinity;
          
          const priceMatch = item.price >= minP && item.price <= maxP;
          
          // FOR DEMO: Log but don't block if price mismatch
          if (!priceMatch) {
            console.log(`    Price mismatch: item ${item.price} not in [${minP}, ${maxP}] - Proceeding anyway for demo`);
          }

          // 2. Location check
          const reqLoc = (request.location || "").toLowerCase().trim();
          const itemLoc = (item.location || "").toLowerCase().trim();
          const locationMatch = !reqLoc || 
                               reqLoc === "ovunque" || 
                               reqLoc === "tutte le città" || 
                               reqLoc === "anywhere" || 
                               itemLoc.includes(reqLoc) || 
                               reqLoc.includes(itemLoc);
          
          // FOR DEMO: Log but don't block if location mismatch
          if (!locationMatch) {
            console.log(`    Location mismatch: req "${reqLoc}" vs item "${itemLoc}" - Proceeding anyway for demo`);
          }

          // 3. Keyword check
          let isMatch = false;
          
          // Check if the full query string is found anywhere
          const fullQueryPresent = titleLower.includes(queryLower) || descLower.includes(queryLower);
          
          // Check if ANY query word is present (extremely lenient)
          const matchedWords = queryWords.filter((word: string) => titleLower.includes(word) || descLower.includes(word));
          const anyWordMatch = matchedWords.length > 0;

          isMatch = fullQueryPresent || anyWordMatch;
          console.log(`    Keyword match: ${isMatch} (full: ${fullQueryPresent}, any: ${anyWordMatch})`);

          if (isMatch) {
            // Check if proposal already exists
            const existing = (await pool.query("SELECT id FROM proposals WHERE request_id = $1 AND item_id = $2", [request.id, item.id])).rows[0];
            if (!existing) {
              const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h expiry
              await pool.query("INSERT INTO proposals (request_id, item_id, expires_at) VALUES ($1, $2, $3)", [request.id, item.id, expiresAt]);
              matchesCreated++;
              
              // Notify buyer
              io.to(request.buyer_id).emit("notification", {
                type: "matched_item",
                title: "Nuovo Match Trovato!",
                body: `Abbiamo trovato un match per la tua ricerca: "${item.title}"`,
                data: { itemId: item.id, requestId: request.id }
              });

              console.log(`    MATCH CREATED!`);
            } else {
              console.log(`    Match already exists.`);
            }
          }
        }
      }
      console.log(`Match finished. Created ${matchesCreated} matches.`);
      res.json({ matchesCreated });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stats API
  app.get("/api/stats/top-searches", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT query, COUNT(*) as count 
        FROM requests 
        WHERE query IS NOT NULL AND query != ''
        GROUP BY LOWER(TRIM(query)) 
        ORDER BY count DESC 
        LIMIT 20
      `);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
