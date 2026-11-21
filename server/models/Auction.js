const mongoose = require('mongoose');
const { isMemory } = require('../config/db');
const { createMemoryModel } = require('../config/memoryStore');

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'Collectibles',
    },
    startingPrice: {
      type: Number,
      required: true,
      min: 1,
    },
    currentBid: {
      type: Number,
      required: true,
      min: 1,
    },
    currentHighestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 10,
    },
    minIncrement: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ENDED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    winningBid: {
      type: Number,
      default: null,
    },
    bidCount: {
      type: Number,
      default: 0,
    },
    isExtended: {
      type: Boolean,
      default: false,
    },
    extensionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseAuction = mongoose.model('Auction', auctionSchema);
const MemoryAuction = createMemoryModel('auctions');

const Auction = {
  async create(data) {
    if (isMemory()) {
      return await MemoryAuction.create(data);
    }
    return await MongooseAuction.create(data);
  },

  find(filter) {
    if (isMemory()) return MemoryAuction.find(filter);
    return MongooseAuction.find(filter);
  },

  findOne(filter) {
    if (isMemory()) return MemoryAuction.findOne(filter);
    return MongooseAuction.findOne(filter);
  },

  findById(id) {
    if (isMemory()) return MemoryAuction.findById(id);
    return MongooseAuction.findById(id);
  },

  countDocuments(filter) {
    if (isMemory()) return MemoryAuction.countDocuments(filter);
    return MongooseAuction.countDocuments(filter);
  },

  findOneAndUpdate(filter, update, options) {
    if (isMemory()) return MemoryAuction.findOneAndUpdate(filter, update, options);
    return MongooseAuction.findOneAndUpdate(filter, update, options);
  },

  async findByIdAndDelete(id) {
    if (isMemory()) return await MemoryAuction.findByIdAndDelete(id);
    return await MongooseAuction.findByIdAndDelete(id);
  },

  async deleteOne(filter) {
    if (isMemory()) return await MemoryAuction.deleteOne(filter);
    return await MongooseAuction.deleteOne(filter);
  },

  schema: auctionSchema,
  mongooseModel: MongooseAuction,
};

module.exports = Auction;
