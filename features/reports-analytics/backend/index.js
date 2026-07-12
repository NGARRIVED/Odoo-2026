const express = require('express');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');
const { getDashboardSummary, getAssetsByStatus, getAssetsByCategory } = require('./reports.controller');

const router = express.Router();

router.use(requireAuth);
// Restrict reports to managers and above
router.use(requireRole(['ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']));

router.get('/summary', getDashboardSummary);
router.get('/assets-by-status', getAssetsByStatus);
router.get('/assets-by-category', getAssetsByCategory);

module.exports = router;
