import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DELHI_TOKEN = process.env.DELHIVERY_TOKEN || 'f905626fb84eb318f32f2b3feb79736921084cf6';
  const DELHI_BASE_URL = 'https://track.delhivery.com'; // Using production URL as per snippets
  const DELHI_STAGING_URL = 'https://staging-express.delhivery.com';

  // Delhivery API Routes
  
  // 1. Pincode Check (Delivery Date Check)
  app.get("/api/delhivery/pincode/:pincode", async (req, res) => {
    try {
      const { pincode } = req.params;
      const response = await fetch(`${DELHI_BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`, {
        method: 'GET',
        headers: { Authorization: `Token ${DELHI_TOKEN}` }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Delhivery Pincode Error:", error);
      res.status(500).json({ error: "Failed to check pincode" });
    }
  });

  // 2. Tracking
  app.get("/api/delhivery/track/:waybill", async (req, res) => {
    try {
      const { waybill } = req.params;
      const { order_id } = req.query;
      const response = await fetch(`${DELHI_BASE_URL}/api/v1/packages/json/?waybill=${waybill}&ref_ids=${order_id || ''}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${DELHI_TOKEN}` }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Delhivery Tracking Error:", error);
      res.status(500).json({ error: "Failed to track shipment" });
    }
  });

  // 3. Shipment Creation
  app.post("/api/delhivery/shipment", async (req, res) => {
    try {
      const shipmentData = req.body;
      const response = await fetch(`${DELHI_STAGING_URL}/api/cmu/create.json`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${DELHI_TOKEN}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipmentData)
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Delhivery Shipment Creation Error:", error);
      res.status(500).json({ error: "Failed to create shipment" });
    }
  });

  // 5. Pickup Request
  app.post("/api/delhivery/pickup", async (req, res) => {
    try {
      const pickupData = req.body;
      const response = await fetch(`${DELHI_STAGING_URL}/fm/request/new/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${DELHI_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pickupData)
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Delhivery Pickup Request Error:", error);
      res.status(500).json({ error: "Failed to create pickup request" });
    }
  });

  // 4. Shipping Cost Calculation
  app.get("/api/delhivery/cost", async (req, res) => {
    try {
      const { d_pin, o_pin, cgm, pt } = req.query;
      const response = await fetch(`${DELHI_BASE_URL}/api/kinko/v1/invoice/charges/.json?md=E&ss=Delivered&d_pin=${d_pin}&o_pin=${o_pin}&cgm=${cgm}&pt=${pt}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Token ${DELHI_TOKEN}` }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Delhivery Cost Error:", error);
      res.status(500).json({ error: "Failed to calculate shipping cost" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
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
