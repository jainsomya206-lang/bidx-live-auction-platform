const Auction = require('../models/Auction');

let ioInstance = null;
let intervalId = null;

function setSocketIO(io) {
  ioInstance = io;
}

async function checkAndCloseExpiredAuctions() {
  try {
    const now = new Date();
    // Find all auctions that are still marked ACTIVE but whose endTime has passed
    const expiredAuctions = await Auction.find({
      status: 'ACTIVE',
      endTime: { $lte: now },
    });

    if (!expiredAuctions || expiredAuctions.length === 0) return;

    for (const auction of expiredAuctions) {
      // Atomic guard: ensure only ONE thread or ticker can close it and declare winner
      const closedAuction = await Auction.findOneAndUpdate(
        {
          _id: auction._id,
          status: 'ACTIVE',
          endTime: { $lte: now },
        },
        {
          $set: {
            status: 'ENDED',
            winner: auction.currentHighestBidder || null,
            winningBid: auction.bidCount > 0 ? auction.currentBid : 0,
          },
        },
        { new: true }
      )
        .populate('winner', 'name email avatar role')
        .populate('currentHighestBidder', 'name email avatar role')
        .populate('seller', 'name email');

      if (closedAuction) {
        console.log(`[AuctionCloser] Auction "${closedAuction.title}" closed. Winner: ${closedAuction.winner?.name || 'No bids placed'}`);

        if (ioInstance) {
          const payload = {
            auctionId: closedAuction._id.toString(),
            title: closedAuction.title,
            status: 'ENDED',
            winner: closedAuction.winner || null,
            winningBid: closedAuction.winningBid,
            hasWinner: !!closedAuction.winner && closedAuction.bidCount > 0,
            closedAt: new Date().toISOString(),
          };

          // Broadcast to auction room and platform-wide
          ioInstance.to(`auction:${closedAuction._id.toString()}`).emit('auction:ended', payload);
          ioInstance.emit('auction:status_changed', payload);

          // Platform banner toast
          if (closedAuction.winner) {
            ioInstance.emit('platform:toast', {
              type: 'auction_winner',
              title: 'Auction Ended & Won!',
              message: `${closedAuction.winner.name} won "${closedAuction.title}" for $${closedAuction.winningBid.toLocaleString()}!`,
              auctionId: closedAuction._id.toString(),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[AuctionCloser] Error checking expired auctions:', err.message);
  }
}

function startAuctionCloser(io, intervalMs = 1000) {
  if (io) setSocketIO(io);
  if (intervalId) clearInterval(intervalId);

  // Check every 1000ms
  intervalId = setInterval(checkAndCloseExpiredAuctions, intervalMs);
  console.log(`[AuctionCloser] Automatic auction closure ticker started (every ${intervalMs}ms).`);
}

function stopAuctionCloser() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  setSocketIO,
  startAuctionCloser,
  stopAuctionCloser,
  checkAndCloseExpiredAuctions,
};
