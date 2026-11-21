const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const User = require('../models/User');

/**
 * Process a bid atomically with strict validation, anti-sniping extension,
 * and concurrent bid race-condition protection.
 */
async function processBid({ auctionId, userId, amount }) {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Please enter a valid bid amount.');
  }

  // 1. Fetch current auction snapshot & verify user
  const auction = await Auction.findById(auctionId);
  if (!auction) {
    throw new Error('Auction not found.');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  // 2. Validate auction state
  if (auction.status !== 'ACTIVE') {
    throw new Error('This auction has already ended. No new bids can be accepted.');
  }

  const now = Date.now();
  const currentEndTime = new Date(auction.endTime).getTime();

  // 3. Time expiration check
  if (now >= currentEndTime) {
    throw new Error('Auction time has expired.');
  }

  // 4. Seller and highest bidder self-outbid check
  const sellerId = auction.seller?._id ? auction.seller._id.toString() : auction.seller?.toString();
  if (sellerId === userId.toString()) {
    throw new Error('You cannot place a bid on your own auction.');
  }

  const currentBidderId = auction.currentHighestBidder?._id
    ? auction.currentHighestBidder._id.toString()
    : auction.currentHighestBidder?.toString();

  if (currentBidderId === userId.toString()) {
    throw new Error(`You are already the highest bidder at $${auction.currentBid.toLocaleString()}!`);
  }

  // 5. Amount validation: must exceed current highest bid
  const minIncrement = auction.minIncrement || 10;
  const minRequired = auction.bidCount > 0
    ? auction.currentBid + minIncrement
    : auction.startingPrice;

  if (numericAmount < minRequired) {
    throw new Error(
      `Bid must be at least $${minRequired.toLocaleString()} ($${auction.currentBid.toLocaleString()} + $${minIncrement.toLocaleString()} min increment).`
    );
  }

  // 6. Anti-Snipe Protection Check:
  // If bid is placed within final 30 seconds (30,000 ms), extend by 30 seconds
  const timeRemainingMs = currentEndTime - now;
  let isExtended = false;
  let newEndTime = auction.endTime;

  if (timeRemainingMs <= 30000 && timeRemainingMs > 0) {
    isExtended = true;
    // Extend by 30 seconds from now (or add 30s to current end time)
    newEndTime = new Date(now + 30000);
  }

  // 7. Atomic update using conditional query to prevent race conditions:
  // ONLY succeeds if status is still ACTIVE, endTime > now, and currentBid is strictly less than numericAmount.
  const updateQuery = {
    _id: auctionId,
    status: 'ACTIVE',
    endTime: { $gt: new Date() },
    currentBid: { $lt: numericAmount },
  };

  const updateDoc = {
    $set: {
      currentBid: numericAmount,
      currentHighestBidder: user._id,
      ...(isExtended ? { endTime: newEndTime, isExtended: true } : {}),
    },
    $inc: {
      bidCount: 1,
      ...(isExtended ? { extensionCount: 1 } : {}),
    },
  };

  const updatedAuction = await Auction.findOneAndUpdate(
    updateQuery,
    updateDoc,
    { new: true }
  ).populate('currentHighestBidder', 'name email avatar role');

  if (!updatedAuction) {
    throw new Error('Outbid! A higher bid was submitted right before yours. Please submit an updated bid.');
  }

  // 8. Log the immutable bid record
  const bidRecord = await Bid.create({
    auction: auctionId,
    bidder: user._id,
    amount: numericAmount,
    previousBid: auction.currentBid,
    wasExtensionTriggered: isExtended,
    timestamp: new Date(),
  });

  const populatedBid = {
    _id: bidRecord._id.toString(),
    auction: auctionId.toString(),
    amount: numericAmount,
    previousBid: auction.currentBid,
    wasExtensionTriggered: isExtended,
    timestamp: bidRecord.timestamp,
    bidder: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  };

  return {
    success: true,
    auction: updatedAuction,
    bid: populatedBid,
    isExtended,
    newEndTime: isExtended ? newEndTime.toISOString() : null,
    message: isExtended
      ? 'Bid placed! Anti-snipe protection activated: Auction extended by 30 seconds!'
      : 'Bid placed successfully!',
  };
}

module.exports = {
  processBid,
};
