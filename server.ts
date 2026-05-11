import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 1. Setup minimal health checks
app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// 2. Start the server and bind to 0.0.0.0 IMMEDIATELY
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> SERVER STARTING: Port ${PORT} is now OPEN`);
});

server.on('error', (err) => {
  console.error("!!! CRITICAL: Server failed to bind to port:", err);
  process.exit(1);
});

async function setupServer() {
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    console.log(`>>> PRODUCTION MODE ENABLED`);
    console.log(`>>> Current Directory: ${process.cwd()}`);
    console.log(`>>> Dist Path: ${distPath}`);

    if (!fs.existsSync(distPath)) {
      console.warn(`!!! WARNING: Dist directory not found at ${distPath}`);
    } else {
      console.log(`>>> Dist directory found. Contents: ${fs.readdirSync(distPath).join(', ')}`);
    }

    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.error(`!!! ERROR: index.html not found at ${indexPath}`);
        res.status(500).send("Application build artifacts missing. Please rebuild.");
      }
    });
  } else {
    console.log(`>>> DEVELOPMENT MODE ENABLED`);
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }
}

setupServer().catch(err => {
  console.error("!!! CRITICAL: setupServer failed:", err);
});
