const express = require('express');
const controller = require('./asset.controller');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');

const router = express.Router();

router.use(requireAuth);
router.get('/', controller.listAssets);
router.get('/:id', controller.getAsset);
router.post('/', requireRole(['ADMIN', 'ASSET_MANAGER']), controller.createAsset);
router.patch('/:id', requireRole(['ADMIN', 'ASSET_MANAGER']), controller.updateAsset);

module.exports = router;
