import express from "express";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Added error handler to prevent crash on idle client errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message || err);
});

// Initialize Database in the background to not block server startup
async function initDb() {
  let client;
  try {
    console.log("Connecting to DB for background initialization...");
    client = await pool.connect();
    console.log("DB Connected for background initialization!");
    
    // 0. Disable RLS for all tables (FIX for 'not showing objects' / 'permission denied')
    console.log("Disabling RLS on all tables...");
    await client.query(`
      ALTER TABLE items DISABLE ROW LEVEL SECURITY;
      ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
      ALTER TABLE proposals DISABLE ROW LEVEL SECURITY;
      ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
      ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
      ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
    `);
    console.log("RLS disabled successfully.");

    // 1-7. Create tables ensuring they exist
    console.log("Verifying tables structure...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, seller_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, price DECIMAL(10,2) NOT NULL, location TEXT, category TEXT, image_url TEXT, images JSONB DEFAULT '[]'::jsonb, status TEXT DEFAULT 'available', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS requests (id SERIAL PRIMARY KEY, buyer_id TEXT NOT NULL, query TEXT NOT NULL, min_price DECIMAL(10,2) DEFAULT 0, max_price DECIMAL(10,2) DEFAULT 0, location TEXT, status TEXT DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS proposals (id SERIAL PRIMARY KEY, request_id INTEGER REFERENCES requests(id), item_id INTEGER REFERENCES items(id), status TEXT DEFAULT 'pending', expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, item_id INTEGER REFERENCES items(id), created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, sender_id TEXT NOT NULL, receiver_id TEXT NOT NULL, item_id INTEGER REFERENCES items(id), content TEXT NOT NULL, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, proposal_id INTEGER REFERENCES proposals(id), buyer_id TEXT, seller_id TEXT, item_id INTEGER REFERENCES items(id), status TEXT DEFAULT 'checkout', buyer_name TEXT, buyer_surname TEXT, buyer_email TEXT, buyer_phone TEXT, buyer_address TEXT, buyer_city TEXT, buyer_cap TEXT, tracking_id TEXT, courier TEXT, shipping_deadline TIMESTAMPTZ, shipped_at TIMESTAMPTZ, seller_iban TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, nome TEXT, username TEXT, email TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
    `);

    // Ensure snapshot columns exist in transactions
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS title TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS review_rating INTEGER;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS review_comment TEXT;
    `);

    // 8. Create indexes to speed up commonly used queries
    console.log("Verifying indexes...");
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_items_status ON items(status)",
      "CREATE INDEX IF NOT EXISTS idx_items_category ON items(category)",
      "CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id)",
      "CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status)",
      "CREATE INDEX IF NOT EXISTS idx_requests_buyer_id ON requests(buyer_id)",
      "CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_proposals_request_id ON proposals(request_id)",
      "CREATE INDEX IF NOT EXISTS idx_proposals_item_id ON proposals(item_id)",
      "CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status)",
      "CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_favorites_item_id ON favorites(item_id)",
      "CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)",
      "CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)",
      "CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)",
      "CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id)",
      "CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id)",
      "CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions(item_id)"
    ];
    for (const sql of indexes) {
      await client.query(sql);
    }
    console.log("SUCCESS: Database initialized fully.");
  } catch (err: any) {
    console.error("CRITICAL DB INIT ERROR:", err.message || err);
  } finally {
    if (client) client.release();
  }
}

// Main Server Entry Node
async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = parseInt(process.env.PORT || "3000");

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} connected`);
    }
    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes (moved before Vite to ensure they are always reachable)
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  // Cache for public items listing (10s) to survive high DB load
  let cachedItems: any[] = [];
  let lastFetchTime = 0;

  app.get("/api/items", async (req, res) => {
    try {
      const q = req.query.q as string;
      const category = req.query.category as string;
      
      let qStr = (q || "").trim();
      if (qStr === "undefined" || qStr === "null") qStr = "";
      
      let catStr = (category || "").trim();
      if (catStr === "undefined" || catStr === "null" || catStr === "All" || catStr === "Tutte") catStr = "";

      // Only use cache for generic listing (no search, no category)
      const isGeneric = !qStr && !catStr;
      const nowTs = Date.now();
      if (isGeneric && cachedItems.length > 0 && (nowTs - lastFetchTime < 60000)) {
        console.log(`[GET /api/items] Returning cached ${cachedItems.length} items.`);
        return res.json(cachedItems);
      }

      let queryByFilters = `
        SELECT i.*, 
        (SELECT COUNT(*) FROM favorites f WHERE f.item_id = i.id) as LikeCount
        FROM items i 
        WHERE i.status = 'available'
      `;
      const filterParams: any[] = [];
      
      if (qStr) {
        queryByFilters += " AND (i.title ILIKE $1 OR i.description ILIKE $2)";
        filterParams.push(`%${qStr}%`, `%${qStr}%`);
      }

      if (catStr) {
        const paramIdx = filterParams.length + 1;
        queryByFilters += ` AND i.category = $${paramIdx}`;
        filterParams.push(catStr);
      }

      queryByFilters += " ORDER BY i.created_at DESC LIMIT 25";
      
      console.log(`[GET /api/items] FETCHING FROM DB: q="${q}", cat="${category}"`);
      const result = await pool.query(queryByFilters, filterParams);
      
      if (isGeneric) {
        cachedItems = result.rows;
        lastFetchTime = Date.now();
      }

      res.json(result.rows);
    } catch (error: any) {
      console.error("FATAL ERROR in /api/items:", error);
      res.status(500).json({ error: "Server Error", details: error.message });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const { seller_id, title, description, price, location, image_url, images, category } = req.body;
      if (!title || !price) {
        return res.status(400).json({ error: "Titolo e prezzo sono obbligatori" });
      }
      const result = await pool.query(
        "INSERT INTO items (seller_id, title, description, price, location, image_url, images, category) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        [seller_id, title, description, price, location, image_url, JSON.stringify(images || []), category]
      );
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      console.error("Error creating item:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/items/:id/view", async (req, res) => {
    try {
      await pool.query("UPDATE items SET views_count = views_count + 1 WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, price, location, image_url, images, category } = req.body;
      await pool.query(
        "UPDATE items SET title = $1, description = $2, price = $3, location = $4, image_url = $5, images = $6, category = $7, updated_at = NOW() WHERE id = $8",
        [title, description, price, location, image_url, JSON.stringify(images || []), category, id]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await pool.query("DELETE FROM items WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/requests/:userId", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM requests WHERE buyer_id = $1 ORDER BY created_at DESC", [req.params.userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/requests/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM requests WHERE id = $1", [req.params.id]);
      await pool.query("DELETE FROM proposals WHERE request_id = $1", [req.params.id]);
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

  app.post("/api/transactions", async (req, res) => {
    try {
      let { proposal_id, buyer_id, seller_id, item_id, title, price, category, image_url, images, shipping_details } = req.body;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);
      const actualProposalId = (proposal_id && proposal_id !== 0) ? proposal_id : null;

      const result = await pool.query(`
        INSERT INTO transactions (
          proposal_id, buyer_id, seller_id, item_id, 
          buyer_name, buyer_surname, buyer_email, buyer_phone, 
          buyer_address, buyer_city, buyer_cap, 
          shipping_deadline, status,
          title, price, category, image_url, images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'paid', $13, $14, $15, $16, $17)
        RETURNING id
      `, [
        actualProposalId, buyer_id, seller_id, item_id,
        shipping_details.name, shipping_details.surname, shipping_details.email, shipping_details.phone,
        shipping_details.address, shipping_details.city, shipping_details.cap,
        deadline, title, price, category, image_url, JSON.stringify(images || [])
      ]);

      if (actualProposalId) await pool.query("UPDATE proposals SET status = 'accepted' WHERE id = $1", [actualProposalId]);
      await pool.query("UPDATE items SET status = 'sold' WHERE id = $1", [item_id]);

      io.to(seller_id).emit("notification", {
        title: "Prodotto Venduto!",
        body: `Hai venduto "${title}". Hai 5 giorni per spedire.`,
        type: "sale"
      });
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM transactions WHERE buyer_id = $1 OR seller_id = $1 ORDER BY created_at DESC", [req.params.userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transactions/:id/ship", async (req, res) => {
    try {
      const { tracking_id, courier, seller_iban } = req.body;
      await pool.query("UPDATE transactions SET tracking_id = $1, courier = $2, seller_iban = $3, shipped_at = NOW(), status = 'shipped' WHERE id = $4", [tracking_id, courier, seller_iban, req.params.id]);
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

  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY created_at ASC", [req.params.userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { sender_id, receiver_id, item_id, content } = req.body;
      const result = await pool.query("INSERT INTO messages (sender_id, receiver_id, item_id, content) VALUES ($1, $2, $3, $4) RETURNING id", [sender_id, receiver_id, item_id, content]);
      io.to(receiver_id).emit("notification", { type: "new_message", title: "Nuovo Messaggio", body: content.substring(0, 30) });
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const result = await pool.query("SELECT i.* FROM items i JOIN favorites f ON i.id = f.item_id WHERE f.user_id = $1", [req.params.userId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      await pool.query("INSERT INTO favorites (user_id, item_id) VALUES ($1, $2)", [req.body.userId, req.body.itemId]);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Already favorited" });
    }
  });

  app.delete("/api/favorites/:userId/:itemId", async (req, res) => {
    try {
      await pool.query("DELETE FROM favorites WHERE user_id = $1 AND item_id = $2", [req.params.userId, req.params.itemId]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/match", async (req, res) => {
    try {
      const matchResult = await pool.query(`
        WITH new_matches AS (
          SELECT r.id as request_id, i.id as item_id, r.buyer_id, i.title as item_title
          FROM requests r
          CROSS JOIN items i
          WHERE r.status = 'active' AND i.status = 'available'
            AND i.price >= COALESCE(r.min_price, 0)
            AND (r.max_price <= 0 OR r.max_price IS NULL OR i.price <= r.max_price)
            AND (r.location IS NULL OR TRIM(LOWER(r.location)) IN ('', 'ovunque', 'anywhere') OR LOWER(i.location) LIKE '%' || LOWER(TRIM(r.location)) || '%' OR LOWER(TRIM(r.location)) LIKE '%' || LOWER(i.location) || '%')
            AND (LOWER(i.title) LIKE '%' || LOWER(TRIM(r.query)) || '%' OR LOWER(i.description) LIKE '%' || LOWER(TRIM(r.query)) || '%')
            AND NOT EXISTS (SELECT 1 FROM proposals p2 WHERE p2.request_id = r.id AND p2.item_id = i.id)
        )
        INSERT INTO proposals (request_id, item_id, expires_at)
        SELECT request_id, item_id, (NOW() + interval '24 hours') FROM new_matches
        RETURNING request_id, item_id, buyer_id, item_title
      `);
      for (const m of matchResult.rows) {
        io.to(m.buyer_id).emit("notification", { type: "matched_item", title: "Nuovo Match!", body: m.item_title });
      }
      res.json({ matchesCreated: matchResult.rows.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`READY -- API server listening on port ${PORT}`);
    
    // START Background Tasks AFTER listening
    console.log("Starting background database initialization...");
    // initDb().catch(e => console.error("FATAL background DB init failed:", e));

    // Note: This starts Vite as middleware so the frontend is available on port 3000
    if (process.env.NODE_ENV !== "production") {
      (async () => {
        try {
          console.log("Starting background Vite middleware...");
          const vite = await createViteServer({
            server: { middlewareMode: true, hmr: { port: 3005 }, port: 0 },
            appType: "spa"
          });
          app.use(vite.middlewares);
          console.log("Vite middleware attached successfully.");
        } catch (vErr: any) {
          console.error("Vite middleware FAILED (non-fatal):", vErr.message || vErr);
        }
      })();
    } else {
      app.use(express.static(path.join(__dirname, "dist")));
      app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
    }
  });
}

startServer().catch(err => {
  console.error("CRITICAL FATAL: startServer failed:", err);
});
