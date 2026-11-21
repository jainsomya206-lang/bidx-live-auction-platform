const express = require('express');
const router = express.Router();
const {
  getAuctions,
  getAuctionById,
  createAuction,
  deleteAuction,
  getStats,
  extendAllAuctionsForDemo,
} = require('../controllers/auctionController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getAuctions);
router.get('/stats/overview', getStats);
router.post('/demo/extend-all', extendAllAuctionsForDemo);
router.get('/:id', getAuctionById);
router.post('/', protect, createAuction);
router.delete('/:id', protect, adminOnly, deleteAuction);

module.exports = router;
