const mongoose = require('mongoose');
const { isMemory } = require('../config/db');
const { createMemoryModel } = require('../config/memoryStore');

const bidSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    previousBid: {
      type: Number,
      default: 0,
    },
    wasExtensionTriggered: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseBid = mongoose.model('Bid', bidSchema);
const MemoryBid = createMemoryModel('bids');

const Bid = {
  async create(data) {
    if (isMemory()) {
      return await MemoryBid.create(data);
    }
    return await MongooseBid.create(data);
  },

  find(filter) {
    if (isMemory()) return MemoryBid.find(filter);
    return MongooseBid.find(filter);
  },

  findOne(filter) {
    if (isMemory()) return MemoryBid.findOne(filter);
    return MongooseBid.findOne(filter);
  },

  findById(id) {
    if (isMemory()) return MemoryBid.findById(id);
    return MongooseBid.findById(id);
  },

  countDocuments(filter) {
    if (isMemory()) return MemoryBid.countDocuments(filter);
    return MongooseBid.countDocuments(filter);
  },

  schema: bidSchema,
  mongooseModel: MongooseBid,
};

module.exports = Bid;
