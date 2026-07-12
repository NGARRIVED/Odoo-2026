const express = require('express');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');
const allocationController = require('./allocation.controller');
const transferController = require('./transfer.controller');

const router = express.Router();

const managerPlus = [requireAuth, requireRole(['ADMIN', 'ASSET_MANAGER'])];

// Allocations
router.get('/allocations', requireAuth, allocationController.listAllocations);
router.post('/allocations', managerPlus, allocationController.allocateAsset);
router.post('/allocations/:id/return', managerPlus, allocationController.returnAsset);

// Transfers
router.get('/transfers', requireAuth, transferController.listTransfers);
router.post('/transfers', requireAuth, transferController.createTransfer);
router.post('/transfers/:id/approve', managerPlus, transferController.approveTransfer);
router.post('/transfers/:id/reject', managerPlus, transferController.rejectTransfer);

module.exports = router;
