const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');

async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Database already contains users. Skipping initial seed.');
      return;
    }

    console.log('[Seed] Seeding realistic sample users and luxury auctions...');

    // 1. Create Demo Users
    const admin = await User.create({
      name: 'Admin Sovereign',
      email: 'admin@bidx.io',
      password: 'password123',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      balance: 1000000,
    });

    const elena = await User.create({
      name: 'Elena Rostova',
      email: 'elena@bidx.io',
      password: 'password123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      balance: 500000,
    });

    const marcus = await User.create({
      name: 'Marcus Vance',
      email: 'marcus@bidx.io',
      password: 'password123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      balance: 450000,
    });

    const aria = await User.create({
      name: 'Aria Chen',
      email: 'aria@bidx.io',
      password: 'password123',
      role: 'user',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      balance: 380000,
    });

    console.log('[Seed] Created 4 demo users.');

    const now = new Date();

    // 2. Sample Auctions (Original Luxury Goods)
    const sampleAuctions = [
      {
        title: 'Vintage 1968 Fastback GT V8 Muscle Car',
        description:
          'Fully documented frame-off restoration. Powered by a hand-built 427ci V8 engine with dual carburetors producing 480 horsepower. Finished in metallic slate with black dual racing stripes and high-performance disc brakes.',
        category: 'Classic Cars',
        startingPrice: 120000,
        currentBid: 145000,
        currentHighestBidder: marcus._id,
        seller: admin._id,
        images: [
          'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
        ],
        startTime: new Date(now.getTime() - 25 * 60 * 1000),
        endTime: new Date(now.getTime() + 14 * 60 * 1000),
        durationMinutes: 40,
        minIncrement: 1000,
        status: 'ACTIVE',
        bidCount: 4,
      },
      {
        title: 'Heritage Mechanical Chronograph Timepiece Ref. 6239',
        description:
          'Stainless steel mechanical chronograph featuring a triple-register exotic dial, art deco indices, and manual wind movement. Preserved in pristine collector condition with original paperwork.',
        category: 'Luxury Watches',
        startingPrice: 75000,
        currentBid: 89500,
        currentHighestBidder: elena._id,
        seller: admin._id,
        images: [
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1547996160-71dfabbce5d7?auto=format&fit=crop&w=1200&q=80',
        ],
        startTime: new Date(now.getTime() - 10 * 60 * 1000),
        endTime: new Date(now.getTime() + 6 * 60 * 1000),
        durationMinutes: 16,
        minIncrement: 500,
        status: 'ACTIVE',
        bidCount: 5,
      },
      {
        title: 'Vintage 1999 Holographic Dragon Trading Card (Gem Mint 10)',
        description:
          'Rare first print edition holographic trading card certified Gem Mint 10. Exceptional centering, sharp corners, and immaculate surface condition preserved in an archival UV-protected case.',
        category: 'Collectibles',
        startingPrice: 200000,
        currentBid: 242000,
        currentHighestBidder: aria._id,
        seller: admin._id,
        images: [
          'https://images.unsplash.com/photo-1613770327092-23c8a9ba0027?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
        ],
        startTime: new Date(now.getTime() - 30 * 60 * 1000),
        endTime: new Date(now.getTime() + 2 * 60 * 1000 + 45 * 1000),
        durationMinutes: 35,
        minIncrement: 2000,
        status: 'ACTIVE',
        bidCount: 6,
      },
      {
        title: 'Titanium Rangefinder 35mm Precision Lens Camera',
        description:
          'Limited titanium-crafted rangefinder camera body with mechanical shutter and coupled 35mm f/1.4 aperture lens. Exceptional German engineering with tactile manual controls.',
        category: 'Cameras & Optics',
        startingPrice: 8500,
        currentBid: 10200,
        currentHighestBidder: marcus._id,
        seller: admin._id,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80',
        ],
        startTime: new Date(now.getTime() - 5 * 60 * 1000),
        endTime: new Date(now.getTime() + 18 * 60 * 1000),
        durationMinutes: 23,
        minIncrement: 100,
        status: 'ACTIVE',
        bidCount: 3,
      },
      {
        title: 'Spatial Audio Spatial Computing Headset (1TB Special Edition)',
        description:
          'High-resolution micro-OLED spatial display system with precision eye-tracking, bespoke aerospace titanium enclosure, and handcrafted leather harness.',
        category: 'Tech & Hardware',
        startingPrice: 4200,
        currentBid: 5600,
        currentHighestBidder: aria._id,
        seller: admin._id,
        images: [
          'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
        ],
        startTime: new Date(now.getTime() - 15 * 60 * 1000),
        endTime: new Date(now.getTime() + 25 * 60 * 1000),
        durationMinutes: 40,
        minIncrement: 50,
        status: 'ACTIVE',
        bidCount: 5,
      },
      {
        title: 'Original Contemporary Neon Canvas "Neo-Cityscape 2099"',
        description:
          'Large format 60" x 48" mixed media acrylic and luminous pigments on Belgian linen. Features subtle reactive illumination circuitry with Certificate of Authenticity.',
        category: 'Fine Art',
        startingPrice: 14000,
        currentBid: 19800,
        currentHighestBidder: elena._id,
        seller: admin._id,
        images: [
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
        ],
        startTime: new Date(now.getTime() - 12 * 60 * 1000),
        endTime: new Date(now.getTime() + 35 * 60 * 1000),
        durationMinutes: 47,
        minIncrement: 200,
        status: 'ACTIVE',
        bidCount: 4,
      },
      {
        title: 'Astronomical Celestial Grand Complication Timepiece',
        description:
          'Platinum astronomical timepiece with celestial star chart and orbit display. Finished with sapphire crystal exhibition caseback.',
        category: 'Luxury Watches',
        startingPrice: 280000,
        currentBid: 345000,
        currentHighestBidder: elena._id,
        seller: admin._id,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
        ],
        startTime: new Date(now.getTime() - 90 * 60 * 1000),
        endTime: new Date(now.getTime() - 10 * 60 * 1000),
        durationMinutes: 80,
        minIncrement: 5000,
        status: 'ENDED',
        winner: elena._id,
        winningBid: 345000,
        bidCount: 8,
      },
    ];

    for (const auctionData of sampleAuctions) {
      const created = await Auction.create(auctionData);

      if (auctionData.bidCount > 0) {
        const bidders = [elena._id, marcus._id, aria._id];
        const step = (auctionData.currentBid - auctionData.startingPrice) / auctionData.bidCount;
        for (let i = 1; i <= auctionData.bidCount; i++) {
          const bidderId = i === auctionData.bidCount
            ? auctionData.currentHighestBidder
            : bidders[i % bidders.length];
          const bidAmount = Math.round(auctionData.startingPrice + step * i);
          await Bid.create({
            auction: created._id,
            bidder: bidderId,
            amount: bidAmount,
            previousBid: Math.round(auctionData.startingPrice + step * (i - 1)),
            timestamp: new Date(now.getTime() - (auctionData.bidCount - i + 1) * 3 * 60 * 1000),
          });
        }
      }
    }

    console.log(`[Seed] Seeded ${sampleAuctions.length} auctions successfully.`);
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
  }
}

module.exports = {
  seedDatabase,
};
