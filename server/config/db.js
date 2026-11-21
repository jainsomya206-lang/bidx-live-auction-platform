const mongoose = require('mongoose');

let isConnected = false;
let useMemoryFallback = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bidx';
  try {
    console.log(`[DB] Attempting connection to MongoDB at ${uri}...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    useMemoryFallback = false;
    console.log('[DB] ✓ Connected to MongoDB successfully.');
  } catch (err) {
    console.warn(`[DB] ⚠ MongoDB connection failed (${err.message}).`);
    console.log('[DB] 🚀 Activating high-performance in-memory database engine for seamless operation.');
    isConnected = false;
    useMemoryFallback = true;
  }
};

const getDBMode = () => {
  return useMemoryFallback ? 'IN_MEMORY' : 'MONGODB';
};

module.exports = {
  connectDB,
  getDBMode,
  isMemory: () => useMemoryFallback,
};
