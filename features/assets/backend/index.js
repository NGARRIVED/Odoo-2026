const express = require('express');
const controller = require('./asset.controller');

const router = express.Router();

router.get('/', controller.listAssets);
router.get('/:id', controller.getAsset);
router.post('/', controller.createAsset);
router.patch('/:id', controller.updateAsset);

module.exports = router;
