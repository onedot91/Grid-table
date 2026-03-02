import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("matches.db");
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Initialize database
console.log("Initializing database...");
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    student1 INTEGER,
    student2 INTEGER,
    completed INTEGER DEFAULT 0,
    UNIQUE(student1, student2)
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/matches", (req, res) => {
    const matches = db.prepare("SELECT * FROM matches").all();
    res.json(matches);
  });

  app.post("/api/matches/toggle", (req, res) => {
    const { student1, student2 } = req.body;
    // Ensure student1 < student2 for consistency
    const s1 = Math.min(student1, student2);
    const s2 = Math.max(student1, student2);
    const id = `${s1}-${s2}`;

    const existing = db.prepare("SELECT completed FROM matches WHERE id = ?").get(id) as { completed: number } | undefined;
    
    if (existing) {
      const newVal = existing.completed === 1 ? 0 : 1;
      db.prepare("UPDATE matches SET completed = ? WHERE id = ?").run(newVal, id);
      res.json({ id, completed: newVal });
    } else {
      db.prepare("INSERT INTO matches (id, student1, student2, completed) VALUES (?, ?, ?, ?)").run(id, s1, s2, 1);
      res.json({ id, completed: 1 });
    }
  });

  app.post("/api/matches/reset", (req, res) => {
    console.log("Resetting all matches in database...");
    try {
      db.prepare("DELETE FROM matches").run();
      db.prepare("VACUUM").run();
      console.log("Database reset complete.");
      res.json({ status: "ok" });
    } catch (err) {
      console.error("Database reset failed:", err);
      res.status(500).json({ error: "Failed to reset database" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
