const express = require('express');
const { requireAuth } = require('../../authentication/backend/auth.middleware');
const {
  getBookableResources,
  getAssetSchedule,
  createBooking
} = require('./booking.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/resources', getBookableResources);
router.get('/resources/:assetId/schedule', getAssetSchedule);
router.post('/', createBooking);

module.exports = router;
