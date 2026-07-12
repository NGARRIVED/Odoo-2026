const express = require('express');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');
const { getActiveAuditCycle, updateAuditItem, closeAuditCycle } = require('./audit.controller');

const router = express.Router();

router.use(requireAuth, requireRole(['ADMIN']));
router.get('/active', getActiveAuditCycle);
router.patch('/items/:itemId', updateAuditItem);
router.post('/:cycleId/close', closeAuditCycle);

module.exports = router;
