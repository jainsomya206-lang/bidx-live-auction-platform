const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

// @desc    Get all auctions (with optional filters)
// @route   GET /api/auctions
// @access  Public
const getAuctions = async (req, res) => {
  try {
    const { status, category, search, sort } = req.query;
    const filter = {};

    if (status) {
      filter.status = status.toUpperCase();
    }
    if (category && category !== 'All') {
      filter.category = category;
    }

    let auctions = await Auction.find(filter)
      .sort({ createdAt: -1 })
      .populate('currentHighestBidder', 'name email avatar role')
      .populate('winner', 'name email avatar role')
      .populate('seller', 'name email avatar');

    // Filter by search query if present
    if (search && search.trim()) {
      const term = search.toLowerCase();
      auctions = auctions.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term) ||
          a.category.toLowerCase().includes(term)
      );
    }

    return res.json({
      success: true,
      count: auctions.length,
      auctions,
    });
  } catch (err) {
    console.error('getAuctions error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch auctions.',
      error: err.message,
    });
  }
};

// @desc    Get single auction by ID with full details & bid history
// @route   GET /api/auctions/:id
// @access  Public
const getAuctionById = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('currentHighestBidder', 'name email avatar role')
      .populate('winner', 'name email avatar role')
      .populate('seller', 'name email avatar');

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found.',
      });
    }

    // Fetch bid history for this auction, most recent first
    const bids = await Bid.find({ auction: req.params.id })
      .sort({ timestamp: -1 })
      .populate('bidder', 'name email avatar role');

    return res.json({
      success: true,
      auction,
      bids: bids || [],
    });
  } catch (err) {
    console.error('getAuctionById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch auction details.',
      error: err.message,
    });
  }
};

// @desc    Create a new auction
// @route   POST /api/auctions
// @access  Private (Admin or Authenticated User)
const createAuction = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      startingPrice,
      durationMinutes,
      images,
      minIncrement,
    } = req.body;

    if (!title || !description || !startingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and starting price.',
      });
    }

    const duration = Number(durationMinutes) || 10;
    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 1000);

    const defaultImages = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
    ];

    const auctionImages = Array.isArray(images) && images.length > 0
      ? images
      : (req.body.imageUrl ? [req.body.imageUrl] : defaultImages);

    const newAuction = await Auction.create({
      title,
      description,
      category: category || 'Collectibles',
      startingPrice: Number(startingPrice),
      currentBid: Number(startingPrice),
      currentHighestBidder: null,
      seller: req.user._id,
      images: auctionImages,
      startTime: now,
      endTime,
      durationMinutes: duration,
      minIncrement: Number(minIncrement) || 10,
      status: 'ACTIVE',
      bidCount: 0,
    });

    const populated = await Auction.findById(newAuction._id)
      .populate('seller', 'name email avatar');

    // Notify connected clients via global socket if app is running
    const io = req.app.get('io');
    if (io) {
      io.emit('auction:created', populated);
    }

    return res.status(201).json({
      success: true,
      message: 'Auction created successfully!',
      auction: populated,
    });
  } catch (err) {
    console.error('createAuction error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create auction.',
      error: err.message,
    });
  }
};

// @desc    Delete an auction
// @route   DELETE /api/auctions/:id
// @access  Private (Admin only)
const deleteAuction = async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found.',
      });
    }

    await Auction.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('auction:deleted', { auctionId: req.params.id });
    }

    return res.json({
      success: true,
      message: 'Auction deleted successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete auction.',
    });
  }
};

// @desc    Get platform stats
// @route   GET /api/auctions/stats/overview
// @access  Public
const getStats = async (req, res) => {
  try {
    const allAuctions = await Auction.find({});
    const activeAuctions = allAuctions.filter((a) => a.status === 'ACTIVE');
    const endedAuctions = allAuctions.filter((a) => a.status === 'ENDED');
    const totalBids = allAuctions.reduce((acc, a) => acc + (a.bidCount || 0), 0);
    const totalVolume = endedAuctions.reduce((acc, a) => acc + (a.winningBid || 0), 0);

    return res.json({
      success: true,
      stats: {
        activeCount: activeAuctions.length,
        endedCount: endedAuctions.length,
        totalAuctions: allAuctions.length,
        totalBids,
        totalVolume,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics.',
    });
  }
};

// @desc    Reset auction timers for convenient testing/demoing
// @route   POST /api/auctions/demo/extend-all
// @access  Public (for demo convenience)
const extendAllAuctionsForDemo = async (req, res) => {
  try {
    const minutes = Number(req.body.minutes) || 10;
    const now = new Date();
    const newEndTime = new Date(now.getTime() + minutes * 60 * 1000);

    const auctions = await Auction.find({});
    for (const auction of auctions) {
      await Auction.findOneAndUpdate(
        { _id: auction._id },
        {
          $set: {
            status: 'ACTIVE',
            endTime: newEndTime,
            winner: null,
            winningBid: null,
          },
        }
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('platform:timers_reset', { newEndTime: newEndTime.toISOString() });
    }

    return res.json({
      success: true,
      message: `All auctions reset to ACTIVE with ${minutes} minutes remaining!`,
      newEndTime,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reset demo timers.',
    });
  }
};

module.exports = {
  getAuctions,
  getAuctionById,
  createAuction,
  deleteAuction,
  getStats,
  extendAllAuctionsForDemo,
};
