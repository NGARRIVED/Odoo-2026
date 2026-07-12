const express = require('express');
const controller = require('./notification.controller');

const router = express.Router();

router.get('/', controller.listNotifications);
router.patch('/read-all', controller.markAllNotificationsRead);
router.patch('/:id/read', controller.updateNotificationReadState);
router.post('/transfer-requests/:id/decision', controller.resolveTransferRequest);

module.exports = router;
