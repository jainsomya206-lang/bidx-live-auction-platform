const { connectDB } = require('./config/db');
const { seedDatabase } = require('./seed/seedData');
const User = require('./models/User');
const Auction = require('./models/Auction');
const Bid = require('./models/Bid');
const { processBid } = require('./services/biddingService');
const { checkAndCloseExpiredAuctions } = require('./utils/auctionCloser');

async function runTestSuite() {
  console.log('====================================================');
  console.log('   🧪 BIDX COMPREHENSIVE END-TO-END TEST SUITE     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Initialize DB & Seed
    await connectDB();
    await seedDatabase();

    const users = await User.find({});
    assert(users.length >= 4, `Database seeded with ${users.length} users`);

    const admin = users.find(u => u.role === 'admin') || users[0];
    const bidder1 = users.find(u => u.email === 'elena@bidx.io') || users[1];
    const bidder2 = users.find(u => u.email === 'marcus@bidx.io') || users[2];
    const bidder3 = users.find(u => u.email === 'aria@bidx.io') || users[3];

    // 2. Test Auction Retrieval
    const activeAuctions = await Auction.find({ status: 'ACTIVE' });
    assert(activeAuctions.length >= 1, `Found ${activeAuctions.length} active live auctions`);

    const testAuction = activeAuctions[0];
    console.log(`\n  Target Test Lot: "${testAuction.title}"`);
    console.log(`  Initial Current Bid: $${testAuction.currentBid}`);

    // 3. Test Valid Bid Placement
    const nextBidAmount = testAuction.currentBid + testAuction.minIncrement + 100;
    const bidResult1 = await processBid({
      auctionId: testAuction._id.toString(),
      userId: bidder1._id.toString(),
      amount: nextBidAmount,
    });

    assert(bidResult1.success === true, 'Valid bid processed successfully');
    assert(bidResult1.auction.currentBid === nextBidAmount, `Auction currentBid updated to $${nextBidAmount}`);
    assert(bidResult1.auction.currentHighestBidder._id.toString() === bidder1._id.toString(), 'Current highest bidder set to Elena');

    // 4. Test Rejection of Lower or Equal Bid
    let rejectedAsExpected = false;
    try {
      await processBid({
        auctionId: testAuction._id.toString(),
        userId: bidder2._id.toString(),
        amount: nextBidAmount, // Same amount
      });
    } catch (err) {
      rejectedAsExpected = true;
      assert(true, `Equal/lower bid rejected properly: "${err.message}"`);
    }
    if (!rejectedAsExpected) {
      assert(false, 'Expected equal bid to be rejected');
    }

    // 5. Test Rejection when already the highest bidder
    let rejectedSelfBid = false;
    try {
      await processBid({
        auctionId: testAuction._id.toString(),
        userId: bidder1._id.toString(), // Elena is already highest bidder
        amount: nextBidAmount + 1000,
      });
    } catch (err) {
      rejectedSelfBid = true;
      assert(true, `Self-outbid rejected properly: "${err.message}"`);
    }
    if (!rejectedSelfBid) {
      assert(false, 'Expected self-bid to be rejected');
    }

    // 6. Test Concurrent Bidding Race Condition Safety
    console.log('\n  ⚡ Simulating 5 Concurrent Simultaneous Bids...');
    const currentBase = bidResult1.auction.currentBid;
    const minInc = testAuction.minIncrement || 1000;
    const concurrentAmounts = [
      currentBase + minInc * 1,
      currentBase + minInc * 2,
      currentBase + minInc * 3,
      currentBase + minInc * 4,
      currentBase + minInc * 5,
    ];

    const results = await Promise.allSettled(
      concurrentAmounts.map((amt, idx) => {
        const bidder = idx % 2 === 0 ? bidder2 : bidder3;
        return processBid({
          auctionId: testAuction._id.toString(),
          userId: bidder._id.toString(),
          amount: amt,
        });
      })
    );

    const successfulBids = results.filter(r => r.status === 'fulfilled');
    console.log(`  Concurrent results: ${successfulBids.length} bids succeeded, ${results.length - successfulBids.length} bids failed or safely outpaced`);
    const refreshedAuction = await Auction.findById(testAuction._id);
    assert(refreshedAuction.currentBid >= currentBase + 100, `Auction currentBid state consistently progressed to $${refreshedAuction.currentBid}`);

    // 7. Test Anti-Snipe Extension (Bid placed in final 30 seconds)
    console.log('\n  🛡 Testing Anti-Snipe 30s Extension Engine...');
    const snipeAuction = await Auction.create({
      title: 'Snipe Protection Test Lot',
      description: 'Test lot for 30s extension validation',
      startingPrice: 1000,
      currentBid: 1000,
      seller: admin._id,
      durationMinutes: 1,
      startTime: new Date(Date.now() - 50 * 1000),
      endTime: new Date(Date.now() + 15 * 1000), // Exactly 15 seconds remaining (< 30s!)
      status: 'ACTIVE',
      minIncrement: 50,
      bidCount: 0,
    });

    const preSnipeEnd = new Date(snipeAuction.endTime).getTime();
    const snipeBidResult = await processBid({
      auctionId: snipeAuction._id.toString(),
      userId: bidder1._id.toString(),
      amount: 1500,
    });

    const postSnipeEnd = new Date(snipeBidResult.auction.endTime).getTime();
    assert(snipeBidResult.isExtended === true, 'Anti-snipe flag triggered when bid placed in final 30s');
    assert(postSnipeEnd > preSnipeEnd, `Auction endTime extended from ${new Date(preSnipeEnd).toLocaleTimeString()} to ${new Date(postSnipeEnd).toLocaleTimeString()}`);
    assert(postSnipeEnd - Date.now() >= 25000, 'New end time extended by full 30 seconds');

    // 8. Test Automatic Auction Closure and Single Winner Declaration
    console.log('\n  🏆 Testing Automatic Auction Closure & Single Winner Declaration...');
    const expiredAuction = await Auction.create({
      title: 'Expired Clock Test Lot',
      description: 'Test lot for expiration and winner confirmation',
      startingPrice: 2000,
      currentBid: 3500,
      currentHighestBidder: bidder2._id, // Marcus
      seller: admin._id,
      startTime: new Date(Date.now() - 60 * 1000),
      endTime: new Date(Date.now() - 2 * 1000), // Ended 2 seconds ago
      status: 'ACTIVE',
      bidCount: 3,
    });

    // Run closure ticker manually
    await checkAndCloseExpiredAuctions();

    const finalizedAuction = await Auction.findById(expiredAuction._id);
    assert(finalizedAuction.status === 'ENDED', 'Expired auction status transitioned to ENDED');
    assert(finalizedAuction.winner.toString() === bidder2._id.toString(), 'Single verified winner declared: Marcus Vance');
    assert(finalizedAuction.winningBid === 3500, 'Winning bid correctly recorded as $3,500');

    // Clean up temporary test lots
    await Auction.findByIdAndDelete(snipeAuction._id);
    await Auction.findByIdAndDelete(expiredAuction._id);

    console.log('\n====================================================');
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test suite uncaught error:', err);
    process.exit(1);
  }
}

runTestSuite();
