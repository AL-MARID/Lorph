import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { DeepResearchEngine } from "./server/deepResearch";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/deep-research", async (req, res) => {
    try {
      const { query, model } = req.body;
      let apiKey = req.headers.authorization || "";
      apiKey = apiKey.replace(/^(bearer\s*)+/ig, '').trim();
      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        apiKey = (process.env.OLLAMA_CLOUD_API_KEY || process.env.OLLAMA_API_KEY || "").trim();
        apiKey = apiKey.replace(/^(bearer\s*)+/ig, '').trim();
      }
      
      if (!query || !model || !apiKey) {
        console.error("Missing required fields:", { hasQuery: !!query, hasModel: !!model, hasApiKey: !!apiKey });
        return res.status(400).json({ error: `Missing required fields: query=${!!query}, model=${!!model}, apiKey=${!!apiKey}` });
      }

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const engine = new DeepResearchEngine(model, apiKey.trim());
      for await (const chunk of engine.runDeepResearch(query)) {
        res.write(chunk);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
      res.end();
    } catch (error: any) {
      console.error("Deep Research error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.end();
      }
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      let authHeader = req.headers.authorization || "";
      let key = authHeader.replace(/^(bearer\s*)+/ig, '').trim();
      if (!key || key === "undefined" || key === "") {
        key = (process.env.OLLAMA_CLOUD_API_KEY || process.env.OLLAMA_API_KEY || "").trim();
        key = key.replace(/^(bearer\s*)+/ig, '').trim();
      }
      authHeader = `Bearer ${key}`;

      let endpoint = process.env.OLLAMA_ENDPOINT || "https://ollama.com/api/chat";
      // If the user accidentally put the API key in the endpoint field, it will have an underscore and no slashes
      if (endpoint.includes('_') && !endpoint.includes('/')) {
        endpoint = "https://ollama.com/api/chat";
      }
      if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
        endpoint = 'http://' + endpoint;
      }
      
      // Validate URL to prevent Invalid URL crash
      try {
        new URL(endpoint);
      } catch (e) {
        endpoint = "https://ollama.com/api/chat";
      }

      let response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
          },
          body: JSON.stringify(req.body),
        });
      } catch (error: any) {
        if (error.message && error.message.includes('Invalid URL')) {
          return res.status(400).json({ error: `Invalid Ollama Endpoint URL: ${endpoint}` });
        }
        if (error.message && error.message.includes('ECONNREFUSED') && endpoint.includes('localhost')) {
          return res.status(503).json({ 
            error: "Connection refused. It looks like you are trying to connect to a local Ollama instance from inside the cloud environment. To use local models, you must download this project and run it on your own computer." 
          });
        }
        throw error;
      }

      if (!response.ok) {
        return res.status(response.status).send(await response.text());
      }

      if (!response.body) {
        return res.status(500).send("No response body");
      }

      // Stream the response back to the client
      res.setHeader("Content-Type", response.headers.get("Content-Type") || "application/json");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      }
      res.end();
    } catch (error: any) {
      console.error("Proxy error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        res.end();
      }
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
