const express = require('express');
const router = express.Router();
const {
  getBidsForAuction,
  placeBidRest,
} = require('../controllers/bidController');
const { protect } = require('../middleware/auth');

router.get('/auction/:auctionId', getBidsForAuction);
router.post('/', protect, placeBidRest);

module.exports = router;
