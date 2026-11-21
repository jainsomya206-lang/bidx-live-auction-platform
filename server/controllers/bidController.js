const Bid = require('../models/Bid');
const { processBid } = require('../services/biddingService');

// @desc    Get bidding history for an auction
// @route   GET /api/bids/auction/:auctionId
// @access  Public
const getBidsForAuction = async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .sort({ timestamp: -1 })
      .populate('bidder', 'name email avatar role');

    return res.json({
      success: true,
      count: bids.length,
      bids: bids || [],
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch bid history.',
      error: err.message,
    });
  }
};

// @desc    Place a bid via REST API (synchronized with Socket.IO)
// @route   POST /api/bids
// @access  Private
const placeBidRest = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;

    if (!auctionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide auctionId and bid amount.',
      });
    }

    const result = await processBid({
      auctionId,
      userId: req.user._id,
      amount,
    });

    // Broadcast across Socket.IO
    const io = req.app.get('io');
    if (io) {
      const roomName = `auction:${auctionId}`;
      io.to(roomName).emit('bid:placed', {
        auctionId,
        bid: result.bid,
        currentBid: result.auction.currentBid,
        bidCount: result.auction.bidCount,
        currentHighestBidder: result.auction.currentHighestBidder,
        endTime: result.auction.endTime,
        isExtended: result.isExtended,
        message: result.message,
      });

      io.emit('auction:live_update', {
        auctionId,
        currentBid: result.auction.currentBid,
        bidCount: result.auction.bidCount,
        currentHighestBidder: result.auction.currentHighestBidder,
        endTime: result.auction.endTime,
        isExtended: result.isExtended,
      });

      if (result.isExtended) {
        io.to(roomName).emit('auction:extended', {
          auctionId,
          newEndTime: result.newEndTime,
          message: 'Anti-Snipe Alert: Bid placed in final 30s! Auction extended by 30 seconds!',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      auction: result.auction,
      bid: result.bid,
      isExtended: result.isExtended,
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getBidsForAuction,
  placeBidRest,
};
