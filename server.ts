import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;

// 1. Setup minimal health checks
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// 2. Start the server and bind to 0.0.0.0 IMMEDIATELY
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> SERVER PREREQUISITE: Port ${PORT} is now OPEN`);
});

server.on('error', (err) => {
  console.error("!!! CRITICAL: Server failed to bind to port:", err);
  process.exit(1);
});

async function setupServer() {
  const isProd = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "production " || !!process.env.K_SERVICE || !!process.env.FIREBASE_APP_HOSTING;
  
  if (isProd) {
    // In production, we serve from the root dist folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
}

setupServer().catch(err => {
  console.error("Critical server error:", err);
});
