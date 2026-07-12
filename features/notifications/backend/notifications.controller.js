const prisma = require('../../../shared/database');

async function getNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user.employeeId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load notifications.' });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.updateMany({
      where: { id, recipientId: req.user.employeeId },
      data: { isRead: true }
    });
    if (notification.count === 0) return res.status(404).json({ error: 'Notification not found.' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark read.' });
  }
}

async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.user.employeeId, isRead: false },
      data: { isRead: true }
    });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark all read.' });
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
