const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { processBid } = require('../services/biddingService');

function setupAuctionSockets(io) {
  io.on('connection', (socket) => {
    let currentUser = null;

    // Helper: authenticate socket connection if token is provided
    async function authenticateUser(token) {
      if (!token) return null;
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'bidx_ultra_secure_jwt_secret_key_2026_super_secret'
        );
        const user = await User.findById(decoded.id);
        if (user) {
          return {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            balance: user.balance,
          };
        }
      } catch (e) {
        // Token invalid or expired
      }
      return null;
    }

    // Try authenticating from handshake auth or query
    const initialToken = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (initialToken) {
      authenticateUser(initialToken).then((u) => {
        currentUser = u;
      });
    }

    // Explicit login over socket
    socket.on('auth:authenticate', async ({ token }, callback) => {
      const user = await authenticateUser(token);
      currentUser = user;
      if (typeof callback === 'function') {
        callback({ success: !!user, user });
      }
    });

    // Join specific auction room for live updates
    socket.on('auction:join', ({ auctionId }) => {
      if (auctionId) {
        socket.join(`auction:${auctionId}`);
        // Notify current room viewers count
        const room = io.sockets.adapter.rooms.get(`auction:${auctionId}`);
        const viewerCount = room ? room.size : 1;
        io.to(`auction:${auctionId}`).emit('auction:viewers', {
          auctionId,
          viewers: viewerCount,
        });
      }
    });

    // Leave auction room
    socket.on('auction:leave', ({ auctionId }) => {
      if (auctionId) {
        socket.leave(`auction:${auctionId}`);
        const room = io.sockets.adapter.rooms.get(`auction:${auctionId}`);
        const viewerCount = room ? room.size : 0;
        io.to(`auction:${auctionId}`).emit('auction:viewers', {
          auctionId,
          viewers: viewerCount,
        });
      }
    });

    // Server time sync to prevent client clock drift
    socket.on('time:sync', (clientTimestamp, callback) => {
      if (typeof callback === 'function') {
        callback({
          clientSent: clientTimestamp,
          serverTime: Date.now(),
        });
      }
    });

    // Handle real-time live bid submission
    socket.on('bid:place', async (data, callback) => {
      try {
        const { auctionId, amount, token } = data || {};

        // Verify user authentication (via stored socket session or provided token)
        let actingUser = currentUser;
        if (!actingUser && token) {
          actingUser = await authenticateUser(token);
          if (actingUser) currentUser = actingUser;
        }

        if (!actingUser) {
          const errPayload = {
            success: false,
            message: 'You must be signed in to place a bid.',
          };
          if (typeof callback === 'function') callback(errPayload);
          socket.emit('bid:error', errPayload);
          return;
        }

        // Process bid through atomic engine
        const result = await processBid({
          auctionId,
          userId: actingUser._id,
          amount,
        });

        const roomName = `auction:${auctionId}`;

        // 1. Broadcast new bid to everyone in the auction room
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

        // 2. Broadcast high-level update platform-wide so card previews update
        io.emit('auction:live_update', {
          auctionId,
          currentBid: result.auction.currentBid,
          bidCount: result.auction.bidCount,
          currentHighestBidder: result.auction.currentHighestBidder,
          endTime: result.auction.endTime,
          isExtended: result.isExtended,
        });

        // 3. If anti-snipe triggered, broadcast specific extension event
        if (result.isExtended) {
          io.to(roomName).emit('auction:extended', {
            auctionId,
            newEndTime: result.newEndTime,
            extensionCount: result.auction.extensionCount,
            message: '⚡ Anti-Snipe Alert: Bid placed in final 30s! Auction extended by 30 seconds!',
          });
        }

        // 4. Send success back to the bidder
        if (typeof callback === 'function') {
          callback({
            success: true,
            bid: result.bid,
            currentBid: result.auction.currentBid,
            isExtended: result.isExtended,
            message: result.message,
          });
        }
      } catch (err) {
        const errPayload = {
          success: false,
          message: err.message || 'Failed to place bid.',
        };
        if (typeof callback === 'function') callback(errPayload);
        socket.emit('bid:error', errPayload);
      }
    });

    socket.on('disconnect', () => {
      // Cleanup happens automatically in Socket.IO adapter rooms
    });
  });
}

module.exports = {
  setupAuctionSockets,
};
