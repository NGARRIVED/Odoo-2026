const express = require('express');
const { requireAuth } = require('../../authentication/backend/auth.middleware');
const {
  getBookableResources,
  listBookings,
  getBooking,
  getAssetSchedule,
  createBooking,
<<<<<<< Updated upstream
  updateBooking,
=======
>>>>>>> Stashed changes
  cancelBooking
} = require('./booking.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', listBookings);
router.get('/resources', getBookableResources);
router.get('/resources/:assetId/schedule', getAssetSchedule);
router.get('/:bookingId', getBooking);
router.post('/', createBooking);
<<<<<<< Updated upstream
router.patch('/:bookingId', updateBooking);
router.patch('/:bookingId/cancel', cancelBooking);
=======
router.delete('/:id', cancelBooking);
>>>>>>> Stashed changes

module.exports = router;
