const express = require('express');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');
const { getActiveAuditCycle, updateAuditItem, closeAuditCycle, startAuditCycle } = require('./audit.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/active', getActiveAuditCycle);
router.post('/start', requireRole(['ADMIN', 'ASSET_MANAGER']), startAuditCycle);
router.patch('/items/:itemId', requireRole(['ADMIN', 'EMPLOYEE', 'ASSET_MANAGER', 'DEPARTMENT_HEAD']), updateAuditItem);
router.post('/:cycleId/close', requireRole(['ADMIN', 'DEPARTMENT_HEAD']), closeAuditCycle);

module.exports = router;
