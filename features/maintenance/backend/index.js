const express = require('express');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');
const {
  getMaintenanceRequests,
  getMaintainableAssets,
  createMaintenanceRequest,
  updateMaintenanceStatus
} = require('./maintenance.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', getMaintenanceRequests);
router.get('/assets', getMaintainableAssets);
router.post('/', createMaintenanceRequest);
router.patch('/:requestId/status', updateMaintenanceStatus);

module.exports = router;
