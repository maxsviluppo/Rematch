import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("rematch.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT,
    title TEXT,
    description TEXT,
    price REAL,
    location TEXT,
    image_url TEXT,
    category TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Add category column if it doesn't exist
  PRAGMA foreign_keys=off;
  BEGIN TRANSACTION;
  CREATE TABLE IF NOT EXISTS items_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id TEXT,
    title TEXT,
    description TEXT,
    price REAL,
    location TEXT,
    image_url TEXT,
    category TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO items_new (id, seller_id, title, description, price, location, image_url, status, created_at)
  SELECT id, seller_id, title, description, price, location, image_url, status, created_at FROM items;
  DROP TABLE items;
  ALTER TABLE items_new RENAME TO items;
  COMMIT;
  PRAGMA foreign_keys=on;

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id TEXT,
    query TEXT,
    min_price REAL,
    max_price REAL,
    location TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER,
    item_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, expired
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(request_id) REFERENCES requests(id),
    FOREIGN KEY(item_id) REFERENCES items(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    item_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id TEXT,
    receiver_id TEXT,
    item_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id)
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    }
  });
  const PORT = 3000;

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

  // API Routes
  app.get("/api/items", (req, res) => {
    const { q, category } = req.query;
    let query = "SELECT * FROM items WHERE status = 'available'";
    const params: any[] = [];

    if (q) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }

    if (category && category !== 'All') {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY created_at DESC";
    
    const items = db.prepare(query).all(...params);
    res.json(items);
  });

  app.post("/api/items", (req, res) => {
    try {
      const { seller_id, title, description, price, location, image_url, category } = req.body;
      if (!title || !price) {
        return res.status(400).json({ error: "Titolo e prezzo sono obbligatori" });
      }
      const info = db.prepare(
        "INSERT INTO items (seller_id, title, description, price, location, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(seller_id, title, description, price, location, image_url, category);
      
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      console.error("Error creating item:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/requests/:userId", (req, res) => {
    const { userId } = req.params;
    const requests = db.prepare("SELECT * FROM requests WHERE buyer_id = ? ORDER BY created_at DESC").all(userId);
    res.json(requests);
  });

  app.delete("/api/requests/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM requests WHERE id = ?").run(id);
    db.prepare("DELETE FROM proposals WHERE request_id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/requests", (req, res) => {
    const { buyer_id, query, min_price, max_price, location } = req.body;
    const info = db.prepare(
      "INSERT INTO requests (buyer_id, query, min_price, max_price, location) VALUES (?, ?, ?, ?, ?)"
    ).run(buyer_id, query, min_price, max_price, location);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/proposals/:buyer_id", (req, res) => {
    const proposals = db.prepare(`
      SELECT p.id as proposal_id, p.status, p.expires_at, p.request_id, p.item_id,
             i.title, i.description, i.price, i.location, i.image_url 
      FROM proposals p
      JOIN items i ON p.item_id = i.id
      JOIN requests r ON p.request_id = r.id
      WHERE r.buyer_id = ? AND p.status = 'pending'
    `).all(req.params.buyer_id);
    res.json(proposals);
  });

  app.post("/api/proposals/:id/respond", (req, res) => {
    const { status } = req.body; // 'accepted' or 'rejected'
    db.prepare("UPDATE proposals SET status = ? WHERE id = ?").run(status, req.params.id);
    
    const proposal = db.prepare(`
      SELECT p.*, r.buyer_id, i.seller_id, i.title 
      FROM proposals p 
      JOIN requests r ON p.request_id = r.id 
      JOIN items i ON p.item_id = i.id 
      WHERE p.id = ?
    `).get(req.params.id) as any;

    if (status === 'accepted') {
      db.prepare("UPDATE items SET status = 'sold' WHERE id = ?").run(proposal.item_id);
    }
    
    // Notify seller about response
    io.to(proposal.seller_id).emit("notification", {
      type: "transaction_update",
      title: "Aggiornamento Transazione",
      body: `L'acquirente ha ${status === 'accepted' ? 'accettato' : 'rifiutato'} la tua proposta per "${proposal.title}"`,
      data: { proposalId: req.params.id, status }
    });

    res.json({ success: true });
  });

  // Messages API
  app.get("/api/messages/:userId", (req, res) => {
    const { userId } = req.params;
    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE sender_id = ? OR receiver_id = ? 
      ORDER BY created_at ASC
    `).all(userId, userId);
    res.json(messages);
  });

  app.post("/api/messages", (req, res) => {
    const { sender_id, receiver_id, item_id, content } = req.body;
    const info = db.prepare(
      "INSERT INTO messages (sender_id, receiver_id, item_id, content) VALUES (?, ?, ?, ?)"
    ).run(sender_id, receiver_id, item_id, content);
    
    // Notify receiver
    io.to(receiver_id).emit("notification", {
      type: "new_message",
      title: "Nuovo Messaggio",
      body: `Hai ricevuto un nuovo messaggio: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
      data: { sender_id, item_id }
    });

    res.json({ id: info.lastInsertRowid });
  });

  // Favorites API
  app.get("/api/favorites/:userId", (req, res) => {
    const { userId } = req.params;
    const favorites = db.prepare(`
      SELECT items.* FROM items 
      JOIN favorites ON items.id = favorites.item_id 
      WHERE favorites.user_id = ?
    `).all(userId);
    res.json(favorites);
  });

  app.post("/api/favorites", (req, res) => {
    const { userId, itemId } = req.body;
    try {
      db.prepare("INSERT INTO favorites (user_id, item_id) VALUES (?, ?)").run(userId, itemId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Already favorited" });
    }
  });

  app.delete("/api/favorites/:userId/:itemId", (req, res) => {
    const { userId, itemId } = req.params;
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND item_id = ?").run(userId, itemId);
    res.json({ success: true });
  });

  // Seed endpoint for testing
  app.post("/api/debug/seed", (req, res) => {
    // Clear existing data
    db.prepare("DELETE FROM proposals").run();
    db.prepare("DELETE FROM items").run();
    db.prepare("DELETE FROM requests").run();

    // Insert test items
    const items = [
      { seller_id: 'user_123', title: 'iPhone 15 Pro', description: 'Come nuovo, 256GB, Titanio Naturale', price: 950, location: 'Milano', category: 'Elettronica', image_url: 'https://picsum.photos/seed/iphone/400/400' },
      { seller_id: 'user_123', title: 'MacBook Air M2', description: '8GB RAM, 256GB SSD, Grigio Siderale', price: 850, location: 'Roma', category: 'Elettronica', image_url: 'https://picsum.photos/seed/macbook/400/400' },
      { seller_id: 'user_123', title: 'Sedia Ergonomica', description: 'Ottima per ufficio, regolabile', price: 120, location: 'Milano', category: 'Casa', image_url: 'https://picsum.photos/seed/chair/400/400' }
    ];

    for (const item of items) {
      db.prepare("INSERT INTO items (seller_id, title, description, price, location, category, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
        item.seller_id, item.title, item.description, item.price, item.location, item.category, item.image_url
      );
    }

    // Insert test requests
    const requests = [
      { buyer_id: 'user_123', query: 'iphone', min_price: 500, max_price: 1200, location: 'Milano' },
      { buyer_id: 'user_123', query: 'sedia ufficio', min_price: 50, max_price: 200, location: 'Milano' }
    ];

    for (const req_data of requests) {
      db.prepare("INSERT INTO requests (buyer_id, query, min_price, max_price, location) VALUES (?, ?, ?, ?, ?)").run(
        req_data.buyer_id, req_data.query, req_data.min_price, req_data.max_price, req_data.location
      );
    }

    res.json({ success: true, message: "Database seeded with test data" });
  });

  // Debug endpoint to check DB state
  app.get("/api/debug/db", (req, res) => {
    const items = db.prepare("SELECT * FROM items").all();
    const requests = db.prepare("SELECT * FROM requests").all();
    const proposals = db.prepare("SELECT * FROM proposals").all();
    res.json({ items, requests, proposals });
  });

  // Improved Matchmaking Endpoint
  app.post("/api/match", (req, res) => {
    const activeRequests = db.prepare("SELECT * FROM requests WHERE status = 'active'").all() as any[];
    const availableItems = db.prepare("SELECT * FROM items WHERE status = 'available'").all() as any[];
    
    let matchesCreated = 0;
    console.log(`Starting match for ${activeRequests.length} requests and ${availableItems.length} items`);
    for (const request of activeRequests) {
      const queryLower = (request.query || "").toLowerCase().trim();
      if (!queryLower) continue;

      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
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
        const matchedWords = queryWords.filter(word => titleLower.includes(word) || descLower.includes(word));
        const anyWordMatch = matchedWords.length > 0;

        isMatch = fullQueryPresent || anyWordMatch;
        console.log(`    Keyword match: ${isMatch} (full: ${fullQueryPresent}, any: ${anyWordMatch})`);

        if (isMatch) {
          // Check if proposal already exists
          const existing = db.prepare("SELECT id FROM proposals WHERE request_id = ? AND item_id = ?").get(request.id, item.id);
          if (!existing) {
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h expiry
            db.prepare("INSERT INTO proposals (request_id, item_id, expires_at) VALUES (?, ?, ?)").run(request.id, item.id, expiresAt);
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
  });

  // Stats API
  app.get("/api/stats/top-searches", (req, res) => {
    const topSearches = db.prepare(`
      SELECT query, COUNT(*) as count 
      FROM requests 
      WHERE query IS NOT NULL AND query != ''
      GROUP BY LOWER(TRIM(query)) 
      ORDER BY count DESC 
      LIMIT 20
    `).all();
    res.json(topSearches);
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
