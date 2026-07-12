const express = require('express');
const { requireAuth } = require('../../authentication/backend/auth.middleware');
const { getNotifications, markAsRead, markAllAsRead } = require('./notifications.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', getNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
