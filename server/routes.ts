import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertMemeSchema, insertMemeVoteSchema, insertCustomAssetSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// WebSocket clients for real-time updates
const wsClients = new Set<WebSocket>();

// Broadcast to all connected WebSocket clients
function broadcast(data: any) {
  const message = JSON.stringify(data);
  wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Enhanced exchange rates with comprehensive crypto and fiat support
const mockExchangeRates = {
  // Major Fiat Currencies
  'USD': { rate: 1, symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  'EUR': { rate: 0.92, symbol: '€', name: 'Euro', flag: '🇪🇺' },
  'GBP': { rate: 0.78, symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  'JPY': { rate: 150, symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  'CAD': { rate: 1.37, symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  'AUD': { rate: 1.51, symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  'CHF': { rate: 0.87, symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  'CNY': { rate: 7.09, symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  'INR': { rate: 83.5, symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  'BRL': { rate: 5.15, symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  'MXN': { rate: 16.8, symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },
  'ZAR': { rate: 18.5, symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  'SGD': { rate: 1.35, symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  'NZD': { rate: 1.64, symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  'KRW': { rate: 1370, symbol: '₩', name: 'Korean Won', flag: '🇰🇷' },
  'RUB': { rate: 90, symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺' },
  'SEK': { rate: 10.5, symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  'NOK': { rate: 10.8, symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  'TRY': { rate: 32, symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  'HKD': { rate: 7.8, symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  
  // Major Cryptocurrencies
  'BTC': { rate: 0.000023, symbol: '₿', name: 'Bitcoin', flag: '🟠' },
  'ETH': { rate: 0.000387, symbol: 'Ξ', name: 'Ethereum', flag: '🔷' },
  'SOL': { rate: 0.01014, symbol: '◎', name: 'Solana', flag: '🟣' },
  'BNB': { rate: 0.0024, symbol: 'BNB', name: 'Binance Coin', flag: '🟡' },
  'ADA': { rate: 2.5, symbol: 'ADA', name: 'Cardano', flag: '🔵' },
  'DOT': { rate: 0.16, symbol: 'DOT', name: 'Polkadot', flag: '🔴' },
  'MATIC': { rate: 1.2, symbol: 'MATIC', name: 'Polygon', flag: '🟪' },
  'AVAX': { rate: 0.03, symbol: 'AVAX', name: 'Avalanche', flag: '🔺' }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Exchange rates
  app.get('/api/exchange-rates', async (req, res) => {
    try {
      // In production, fetch from real API and cache in database
      const rates = Object.entries(mockExchangeRates).map(([currency, data]) => ({
        currency,
        rate: data.rate,
        symbol: data.symbol,
        lastUpdated: new Date()
      }));
      res.json(rates);
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  // Meme routes
  app.get('/api/memes', async (req, res) => {
    try {
      const { limit = 50, contestPeriod } = req.query;
      const memes = await storage.getMemes(
        parseInt(limit as string), 
        contestPeriod as string
      );
      res.json(memes);
    } catch (error) {
      console.error("Error fetching memes:", error);
      res.status(500).json({ message: "Failed to fetch memes" });
    }
  });

  app.post('/api/memes', upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const userId = req.user?.claims?.sub || "admin";
      const { title, assetType, contestPeriod } = req.body;

      // Process image with Sharp
      const filename = `meme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`;
      const outputPath = path.join('uploads', filename);
      
      await sharp(req.file.path)
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // Clean up original upload
      fs.unlinkSync(req.file.path);

      const memeData = {
        userId,
        title: title || 'Untitled Meme',
        imageUrl: `/uploads/${filename}`,
        assetType: assetType || 'yacht',
        contestPeriod: contestPeriod || 'daily'
      };

      const validatedData = insertMemeSchema.parse(memeData);
      const meme = await storage.createMeme(validatedData);

      // Broadcast new meme to all connected clients
      broadcast({ type: 'new_meme', meme });

      res.json(meme);
    } catch (error) {
      console.error("Error uploading meme:", error);
      res.status(500).json({ message: "Failed to upload meme" });
    }
  });

  // Vote routes
  app.post('/api/memes/:id/vote', async (req: any, res) => {
    try {
      const memeId = parseInt(req.params.id);
      const userId = req.user?.claims?.sub || "guest";
      const { voteType } = req.body;

      if (!['up', 'down'].includes(voteType)) {
        return res.status(400).json({ message: "Invalid vote type" });
      }

      // Check if user already voted
      const existingVote = await storage.getUserVote(memeId, userId);
      
      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // Remove vote if same type
          await storage.deleteVote(memeId, userId);
        } else {
          // Delete old vote and create new one
          await storage.deleteVote(memeId, userId);
          const voteData = { memeId, userId, voteType };
          const validatedData = insertMemeVoteSchema.parse(voteData);
          await storage.createVote(validatedData);
        }
      } else {
        // Create new vote
        const voteData = { memeId, userId, voteType };
        const validatedData = insertMemeVoteSchema.parse(voteData);
        await storage.createVote(validatedData);
      }

      // Update meme vote counts
      const currentMeme = await storage.getMeme(memeId);
      if (currentMeme) {
        const upvotes = voteType === 'up' ? (currentMeme.upvotes || 0) + (existingVote?.voteType === 'up' ? -1 : 1) : (currentMeme.upvotes || 0) + (existingVote?.voteType === 'up' ? -1 : 0);
        const downvotes = voteType === 'down' ? (currentMeme.downvotes || 0) + (existingVote?.voteType === 'down' ? -1 : 1) : (currentMeme.downvotes || 0) + (existingVote?.voteType === 'down' ? -1 : 0);
        
        await storage.updateMemeVotes(memeId, Math.max(0, upvotes), Math.max(0, downvotes));

        // Broadcast vote update to all connected clients
        broadcast({ 
          type: 'vote_update', 
          memeId, 
          upvotes: Math.max(0, upvotes), 
          downvotes: Math.max(0, downvotes) 
        });
      }

      const updatedMeme = await storage.getMeme(memeId);
      res.json({ 
        success: true, 
        upvotes: Math.max(0, updatedMeme?.upvotes || 0), 
        downvotes: Math.max(0, updatedMeme?.downvotes || 0) 
      });
    } catch (error) {
      console.error("Error voting on meme:", error);
      res.status(500).json({ message: "Failed to vote on meme" });
    }
  });

  // Custom assets
  app.get('/api/custom-assets', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || "admin";
      const assets = await storage.getUserCustomAssets(userId);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching custom assets:", error);
      res.status(500).json({ message: "Failed to fetch custom assets" });
    }
  });

  app.post('/api/custom-assets', async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || "admin";
      const assetData = { ...req.body, userId };
      const validatedData = insertCustomAssetSchema.parse(assetData);
      const asset = await storage.createCustomAsset(validatedData);
      res.json(asset);
    } catch (error) {
      console.error("Error creating custom asset:", error);
      res.status(500).json({ message: "Failed to create custom asset" });
    }
  });

  // Contests
  app.get('/api/contests/active', async (req, res) => {
    try {
      const contests = await storage.getActiveContests();
      res.json(contests);
    } catch (error) {
      console.error("Error fetching active contests:", error);
      res.status(500).json({ message: "Failed to fetch active contests" });
    }
  });

  // Seed starter memes endpoint (for admin use)
  app.post('/api/seed-memes', async (req, res) => {
    try {
      const starterMemes = [
        {
          userId: "admin",
          title: "When You Could've Just $RENT",
          imageUrl: "/uploads/rent-meme-1.jpg",
          assetType: "yacht",
          contestPeriod: "2025-01"
        },
        {
          userId: "admin", 
          title: "$RENT vs Own: The Math Doesn't Lie",
          imageUrl: "/uploads/rent-meme-2.jpg",
          assetType: "mansion",
          contestPeriod: "2025-01"
        },
        {
          userId: "admin",
          title: "Private Jet Owner vs $RENT Enjoyer",
          imageUrl: "/uploads/rent-meme-3.jpg",
          assetType: "jet", 
          contestPeriod: "2025-01"
        },
        {
          userId: "admin",
          title: "Marriage: The Ultimate Ownership Trap",
          imageUrl: "/uploads/rent-meme-4.jpg",
          assetType: "marriage",
          contestPeriod: "2025-01"
        }
      ];

      for (const meme of starterMemes) {
        await storage.createMeme(meme);
      }

      res.json({ message: "Starter memes created successfully!" });
    } catch (error) {
      console.error("Error seeding memes:", error);
      res.status(500).json({ message: "Failed to seed memes" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      wsClients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(ws);
    });
  });

  return httpServer;
}
