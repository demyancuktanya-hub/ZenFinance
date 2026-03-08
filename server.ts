import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { Octokit } from "@octokit/rest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("finance.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budgets (
    category TEXT PRIMARY KEY,
    amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recurring_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
    day_of_month INTEGER NOT NULL,
    last_processed TEXT
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('stock', 'crypto', 'bond', 'other')) NOT NULL,
    purchase_date TEXT NOT NULL,
    current_value REAL NOT NULL
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GitHub OAuth Routes
  app.get("/api/auth/github/url", (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || "",
      redirect_uri: `${baseUrl}/auth/github/callback`,
      scope: "user,repo",
      state: "random_state_string"
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
  });

  app.get("/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    
    try {
      // Exchange code for token
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code
        })
      });
      
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error("Failed to get access token");
      }

      // In a real app, you'd store this in a session or DB
      // For this demo, we'll pass it back to the client via postMessage
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GITHUB_AUTH_SUCCESS', 
                  token: '${accessToken}' 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Авторизация успешна! Это окно закроется автоматически.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub Auth Error:", error);
      res.status(500).send("Ошибка авторизации GitHub");
    }
  });

  // API Routes
  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC").all();
    res.json(transactions);
  });

  app.post("/api/transactions", (req, res) => {
    const { amount, category, description, type, date } = req.body;
    const info = db.prepare(
      "INSERT INTO transactions (amount, category, description, type, date) VALUES (?, ?, ?, ?, ?)"
    ).run(amount, category, description, type, date);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/transactions/:id", (req, res) => {
    db.prepare("DELETE FROM transactions WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/budgets", (req, res) => {
    const budgets = db.prepare("SELECT * FROM budgets").all();
    res.json(budgets);
  });

  app.post("/api/budgets", (req, res) => {
    const { category, amount } = req.body;
    db.prepare("INSERT OR REPLACE INTO budgets (category, amount) VALUES (?, ?)").run(category, amount);
    res.json({ success: true });
  });

  app.get("/api/recurring", (req, res) => {
    const recurring = db.prepare("SELECT * FROM recurring_payments").all();
    res.json(recurring);
  });

  app.post("/api/recurring", (req, res) => {
    const { amount, category, description, type, day_of_month } = req.body;
    const info = db.prepare(
      "INSERT INTO recurring_payments (amount, category, description, type, day_of_month) VALUES (?, ?, ?, ?, ?)"
    ).run(amount, category, description, type, day_of_month);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/recurring/:id", (req, res) => {
    db.prepare("DELETE FROM recurring_payments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Investment Routes
  app.get("/api/investments", (req, res) => {
    const investments = db.prepare("SELECT * FROM investments ORDER BY purchase_date DESC").all();
    res.json(investments);
  });

  app.post("/api/github/sync", async (req, res) => {
    const { token, repoName } = req.body;
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.users.getAuthenticated();
      const owner = user.login;
      const name = repoName || "ZenFinance";

      // 1. Create or get repo
      let repo;
      try {
        const { data } = await octokit.repos.get({ owner, repo: name });
        repo = data;
      } catch (e) {
        const { data } = await octokit.repos.createForAuthenticatedUser({
          name,
          description: "Personal Finance Manager created with ZenFinance",
          private: false,
          auto_init: true
        });
        repo = data;
      }

      // 2. Get all files to push (recursive)
      const filesToPush: { path: string, content: string }[] = [];
      const ignoreDirs = ['node_modules', '.git', 'dist', '.next', 'out'];
      const ignoreFiles = ['finance.db', 'package-lock.json', '.env'];

      const getAllFiles = (dir: string, baseDir: string = '') => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const relPath = path.join(baseDir, item);
          
          if (ignoreDirs.includes(item) || ignoreFiles.includes(item)) continue;
          
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            getAllFiles(fullPath, relPath);
          } else {
            const content = fs.readFileSync(fullPath, 'utf8');
            filesToPush.push({ path: relPath, content });
          }
        }
      };

      getAllFiles(__dirname);

      // 3. Push files one by one (simplified for this demo)
      // In a real app, you'd use a tree/commit API for efficiency
      for (const file of filesToPush) {
        try {
          let sha;
          try {
            const { data } = await octokit.repos.getContent({ owner, repo: name, path: file.path });
            if (!Array.isArray(data)) sha = data.sha;
          } catch (e) {}

          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo: name,
            path: file.path,
            message: `Sync: ${file.path}`,
            content: Buffer.from(file.content).toString('base64'),
            sha
          });
        } catch (e) {
          console.error(`Error pushing ${file.path}:`, e);
        }
      }

      res.json({ success: true, url: repo.html_url });
    } catch (error: any) {
      console.error("GitHub Sync Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/investments", (req, res) => {
    const { name, amount, type, purchase_date, current_value } = req.body;
    const result = db.prepare(`
      INSERT INTO investments (name, amount, type, purchase_date, current_value)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, amount, type, purchase_date, current_value || amount);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/investments/:id", (req, res) => {
    const { current_value } = req.body;
    db.prepare("UPDATE investments SET current_value = ? WHERE id = ?").run(current_value, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/investments/:id", (req, res) => {
    db.prepare("DELETE FROM investments WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpenses
      FROM transactions
    `).get();

    // Monthly Trends
    const trends = db.prepare(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12
    `).all();

    res.json({ ...stats, trends });
  });

  app.get("/api/export", (req, res) => {
    const transactions = db.prepare("SELECT * FROM transactions ORDER BY date DESC").all();
    
    let csv = "ID,Дата,Тип,Категория,Описание,Сумма\n";
    transactions.forEach((t: any) => {
      csv += `${t.id},${t.date},${t.type === 'income' ? 'Доход' : 'Расход'},${t.category},"${t.description || ''}",${t.amount}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.status(200).send(csv);
  });

  // Process recurring payments
  const processRecurring = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const dayOfMonth = today.getDate();
    const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM

    const recurring = db.prepare("SELECT * FROM recurring_payments WHERE day_of_month = ?").all(dayOfMonth);
    
    for (const payment of recurring) {
      // Check if already processed this month
      if (payment.last_processed && payment.last_processed.startsWith(currentMonth)) continue;

      db.prepare(
        "INSERT INTO transactions (amount, category, description, type, date) VALUES (?, ?, ?, ?, ?)"
      ).run(payment.amount, payment.category, payment.description || 'Регулярный платеж', payment.type, dateStr);

      db.prepare("UPDATE recurring_payments SET last_processed = ? WHERE id = ?").run(dateStr, payment.id);
    }
  };

  // Run once on start and then every hour
  processRecurring();
  setInterval(processRecurring, 3600000);

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
