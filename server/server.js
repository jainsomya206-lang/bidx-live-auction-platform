const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seed/seedData');
const { setupAuctionSockets } = require('./sockets/auctionSocket');
const { startAuctionCloser } = require('./utils/auctionCloser');

const authRoutes = require('./routes/authRoutes');
const auctionRoutes = require('./routes/auctionRoutes');
const bidRoutes = require('./routes/bidRoutes');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach io to Express application so routes/controllers can emit events
app.set('io', io);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'BidX Real-Time Auction Engine',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static build if available
const path = require('path');
const fs = require('fs');
const clientDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving production client build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // 404 handler for API when client dist is not built
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found.`,
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Connect to Database (real MongoDB or automatic memory engine)
    await connectDB();

    // 2. Seed initial demo data (users + luxury auctions + live history)
    await seedDatabase();

    // 3. Setup WebSocket Engine
    setupAuctionSockets(io);

    // 4. Start background ticker for auto-closing expired auctions
    startAuctionCloser(io, 1000);

    // 5. Start HTTP & WebSocket Server
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  🚀 BidX Auction Server running on port ${PORT}`);
      console.log(`  ⚡ Socket.IO listening for real-time live bidding`);
      console.log(`  🛡  Anti-Snipe 30s Extension Engine ACTIVE`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

bootstrap();
