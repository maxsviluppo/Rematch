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
  }
});

// Added error handler to prevent crash on idle client errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message || err);
});

// Initialize Database (Schema should be created in Supabase dashboard or via initial migration)
async function initDb() {
  try {
    console.log("Connecting to DB...");
    const client = await pool.connect();
    console.log("DB Connected!");
    
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
        images JSONB DEFAULT '[]'::jsonb,
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
    `);

    // 7. Create users table (for public profiles)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        nome TEXT,
        username TEXT,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Ensure snapshot columns exist in transactions (for existing DBs)
    await client.query(`
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS title TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE transactions ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
    `);

    client.release();
    console.log("SUCCESS: Connected to Supabase PostgreSQL and ensured schema exists");
  } catch (err: any) {
    console.error("DATABASE INITIALIZATION ERROR:", err.message || err);
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
  const PORT = parseInt(process.env.PORT || "3000");

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
      let query = `
        SELECT i.*, 
        (SELECT COUNT(*) FROM favorites f WHERE f.item_id = i.id) as LikeCount
        FROM items i 
        WHERE i.status = 'available'
      `;
      const filterParams: any[] = [];
      
      if (q) {
        query += " AND (i.title ILIKE $1 OR i.description ILIKE $2)";
        filterParams.push(`%${q}%`, `%${q}%`);
      }

      if (category && category !== 'All' && category !== 'Tutte') {
        const paramIdx = filterParams.length + 1;
        query += ` AND i.category = $${paramIdx}`;
        filterParams.push(category);
      }

      query += " ORDER BY i.created_at DESC";
      
      const result = await pool.query(query, filterParams);
      res.json(result.rows);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: error.message });
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
      let { proposal_id, buyer_id, seller_id, item_id, title, price, category, image_url, images, shipping_details } = req.body;
      
      const parsedImages = typeof images === 'string' ? JSON.parse(images) : (images || []);
      const numPrice = parseFloat(price as any) || 0;
      const numItemId = parseInt(item_id as any) || 0;
      const numProposalId = parseInt(proposal_id as any) || 0;
      
      // Calculate 5 days deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 5);

      // Handle proposal_id 0 (direct purchase) by setting it to null
      const actualProposalId = (numProposalId && numProposalId !== 0) ? numProposalId : null;

      const result = await pool.query(`
        INSERT INTO transactions (
          proposal_id, buyer_id, seller_id, item_id, 
          buyer_name, buyer_surname, buyer_email, buyer_phone, 
          buyer_address, buyer_city, buyer_cap, 
          shipping_deadline, status,
          title, price, category, image_url, images
        ) VALUES (
          $1::integer, $2, $3, $4::integer, 
          $5, $6, $7, $8, 
          $9, $10, $11, 
          $12::timestamptz, 'paid',
          $13, $14::numeric, $15, $16, $17::jsonb
        )
        RETURNING id
      `, [
        actualProposalId, buyer_id, seller_id, numItemId,
        shipping_details.name, shipping_details.surname, shipping_details.email, shipping_details.phone,
        shipping_details.address, shipping_details.city, shipping_details.cap,
        deadline,
        title, numPrice, category, image_url, JSON.stringify(parsedImages)
      ]);

      // Update proposal status if exists
      if (actualProposalId) {
        await pool.query("UPDATE proposals SET status = 'accepted' WHERE id = $1", [actualProposalId]);
      }
      
      // Update item status
      await pool.query("UPDATE items SET status = 'sold' WHERE id = $1", [numItemId]);


      // Notify seller of purchase
      io.to(seller_id).emit("notification", {
        title: "Prodotto Venduto!",
        body: `Hai venduto "${title}". Hai 5 giorni per spedire il prodotto.`,
        type: "sale",
        data: { transaction_id: result.rows[0].id }
      });

      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      console.error("TRANSACTION ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/transactions/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const result = await pool.query(`
        SELECT * 
        FROM transactions
        WHERE buyer_id = $1 OR seller_id = $2
        ORDER BY created_at DESC
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
      
      console.log(`CONFIRM SHIPMENT: Transaction ID=${id}`, { tracking_id, courier, seller_iban });

      if (!id || id === 'undefined') {
        return res.status(400).json({ error: "ID Transazione non valido" });
      }

      const result = await pool.query(`
        UPDATE transactions SET 
          tracking_id = $1, 
          courier = $2, 
          seller_iban = $3,
          shipped_at = NOW(),
          status = 'shipped'
        WHERE id = $4
        RETURNING id
      `, [tracking_id, courier, seller_iban, id]);

      if (result.rowCount === 0) {
        console.warn(`CONFIRM SHIPMENT FAILED: Transaction ${id} not found`);
        return res.status(404).json({ error: "Transazione non trovata" });
      }

      console.log(`CONFIRM SHIPMENT SUCCESS: Transaction ${id} updated to 'shipped'`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("CONFIRM SHIPMENT ERROR:", error);
      res.status(500).json({ error: error.message || "Errore interno del server" });
    }
  });

  app.post("/api/transactions/:id/confirm-arrival", async (req, res) => {
    try {
      await pool.query("UPDATE transactions SET status = 'delivered', updated_at = NOW() WHERE id = $1", [req.params.id]);
      
      // Get transaction details for notification
      const trResult = await pool.query("SELECT * FROM transactions WHERE id = $1", [req.params.id]);
      if (trResult.rows.length > 0) {
        const trans = trResult.rows[0];
        // Notify seller of arrival
        io.to(trans.seller_id).emit("notification", {
          title: "Consegna Confermata",
          body: `L'acquirente ha confermato di aver ricevuto "${trans.title}". Il pagamento verrà elaborato.`,
          type: "delivery_confirmed",
          data: { transaction_id: trans.id }
        });
      }

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
        await pool.query("INSERT INTO items (seller_id, title, description, price, location, category, image_url, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [
          item.seller_id, item.title, item.description, item.price, item.location, item.category, item.image_url, '[]'
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
      console.log(`Matching: ${activeRequests.length} requests vs ${availableItems.length} items`);
      
      for (const request of activeRequests) {
        const queryLower = (request.query || "").toLowerCase().trim();
        if (!queryLower) continue;

        const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 0);
        
        for (const item of availableItems) {
          const titleLower = (item.title || "").toLowerCase();
          const descLower = (item.description || "").toLowerCase();
          
          // 1. Price check
          const minP = (request.min_price !== null && !isNaN(request.min_price)) ? request.min_price : 0;
          const maxP = (request.max_price !== null && !isNaN(request.max_price) && request.max_price > 0) ? request.max_price : Infinity;
          if (item.price < minP || item.price > maxP) continue;

          // 2. Location check
          const reqLoc = (request.location || "").toLowerCase().trim();
          const itemLoc = (item.location || "").toLowerCase().trim();
          const locationMatch = !reqLoc || 
                               reqLoc === "ovunque" || 
                               reqLoc === "tutte le città" || 
                               reqLoc === "anywhere" || 
                               itemLoc.includes(reqLoc) || 
                               reqLoc.includes(itemLoc);
          if (!locationMatch) continue;

          // 3. Keyword check
          const fullQueryPresent = titleLower.includes(queryLower) || descLower.includes(queryLower);
          const matchedWords = queryWords.filter((word: string) => titleLower.includes(word) || descLower.includes(word));
          const anyWordMatch = matchedWords.length > 0;

          if (fullQueryPresent || anyWordMatch) {
            // Check if proposal already exists
            const existingResult = await pool.query("SELECT id FROM proposals WHERE request_id = $1 AND item_id = $2", [request.id, item.id]);
            if (existingResult.rows.length === 0) {
              const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
              await pool.query("INSERT INTO proposals (request_id, item_id, expires_at) VALUES ($1, $2, $3)", [request.id, item.id, expiresAt]);
              matchesCreated++;
              
              io.to(request.buyer_id).emit("notification", {
                type: "matched_item",
                title: "Nuovo Match Trovato!",
                body: `Abbiamo trovato un match per la tua ricerca: "${item.title}"`,
                data: { itemId: item.id, requestId: request.id }
              });
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

  app.get("/api/items", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM items WHERE status = 'available' ORDER BY created_at DESC LIMIT 50");
      res.json(result.rows);
    } catch (error: any) {
      console.error("API ITEMS ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
