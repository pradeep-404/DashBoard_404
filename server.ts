import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size limit for large excel JSON uploads
  app.use(express.json({ limit: '50mb' }));

  // In-memory data store
  let entries: any[] = [];

  // API Backend routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/entries", (req, res) => {
    res.json(entries);
  });

  app.post("/api/entries", (req, res) => {
    entries = req.body;
    res.json({ success: true, count: entries.length });
  });

  app.get("/api/zoho-sync", async (req, res) => {
    // Override with the user's provided Google Sheet link instead of the old Zoho environment variable
    let fetchUrl = process.env.SHEET_SHARE_LINK || 'https://docs.google.com/spreadsheets/d/1mmXK5hc-ai48J9LvsPAXvCAGrvmLIG4kokpux8wk3D0/export?format=xlsx';

    try {
      // Auto-correct links
      try {
        let urlObj = new URL(fetchUrl);
        // Try fixing Zoho open links
        if (urlObj.hostname.includes('zoho')) {
          if (urlObj.pathname.includes('/open/')) {
              urlObj.pathname = urlObj.pathname.replace('/open/', '/published/');
          }
          if (urlObj.pathname.includes('/published/') || urlObj.pathname.includes('/publishedsheet/')) {
            urlObj.searchParams.set('download', 'xlsx');
            fetchUrl = urlObj.toString();
          }
        }
        // Try fixing Google Sheets edit links
        if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/edit')) {
          urlObj.pathname = urlObj.pathname.replace('/edit', '/export');
          urlObj.search = '?format=xlsx';
          fetchUrl = urlObj.toString();
        }
      } catch (e) {
        // ignore parse errors
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Remote sheet returned status ${response.status}`);
      }
      
      let filename = 'sheet_sync.xlsx';
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.includes('filename="')) {
        filename = disposition.split('filename="')[1]?.split('"')[0] || filename;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Simple heuristic: if it's text, it might be an HTML error
      if (buffer.length < 10000 && buffer.toString('utf-8').trim().startsWith('<') && buffer.toString('utf-8').toLowerCase().includes('<html')) {
          throw new Error("Link returned an HTML website instead of raw data.\\n\\nIf using Google Sheets: ensure the link is 'Anyone with the link can view' or you used 'Publish to web' as XLSX.\\nIf using Zoho: ensure the link is generated from File -> Publish -> Microsoft Excel.");
      }
      
      res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').set('x-filename', filename).send(buffer);
    } catch (e: any) {
      res.status(500).send(`Failed to fetch remote sheet: ${e.message}`);
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
