const prisma = require('../../../shared/database');

const notificationMeta = {
	ASSET_ASSIGNED: { title: 'Asset Assigned', category: 'asset', tag: 'Info', tagVariant: 'info' },
	MAINTENANCE_APPROVED: { title: 'Maintenance Approved', category: 'maintenance', tag: 'Approved', tagVariant: 'success' },
	MAINTENANCE_REJECTED: { title: 'Maintenance Rejected', category: 'maintenance', tag: 'Rejected', tagVariant: 'danger' },
	BOOKING_CONFIRMED: { title: 'Booking Confirmed', category: 'booking', tag: 'Booking', tagVariant: 'success' },
	BOOKING_CANCELLED: { title: 'Booking Cancelled', category: 'booking', tag: 'Cancelled', tagVariant: 'danger' },
	BOOKING_REMINDER: { title: 'Booking Reminder', category: 'booking', tag: 'Reminder', tagVariant: 'warning' },
	TRANSFER_APPROVED: { title: 'Transfer Approved', category: 'approval', tag: 'Approved', tagVariant: 'success' },
	OVERDUE_RETURN: { title: 'Overdue Return', category: 'critical', tag: 'Critical', tagVariant: 'danger' },
	AUDIT_DISCREPANCY: { title: 'Audit Discrepancy', category: 'critical', tag: 'Critical', tagVariant: 'danger' }
};

const criticalTypes = new Set(['OVERDUE_RETURN', 'AUDIT_DISCREPANCY']);
const bookingTypes = new Set(['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REMINDER']);
const maintenanceTypes = new Set(['MAINTENANCE_APPROVED', 'MAINTENANCE_REJECTED']);

function getCategoryFromType(type) {
	return notificationMeta[type]?.category || 'asset';
}

function getTagFromType(type) {
	return notificationMeta[type]?.tag || 'Info';
}

function getTagVariantFromType(type) {
	return notificationMeta[type]?.tagVariant || 'default';
}

function getTitleFromType(type) {
	return notificationMeta[type]?.title || type.replace(/_/g, ' ');
}

function formatTime(value) {
	return new Date(value).toISOString();
}

function getActivityGroup(value) {
	const createdAt = new Date(value);
	const now = new Date();
	const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

	if (diffInHours <= 24) {
		return 'Today';
	}

	if (diffInHours <= 48) {
		return 'Yesterday';
	}

	if (diffInHours <= 24 * 7) {
		return 'This Week';
	}

	return 'Earlier';
}

function serializeNotification(notification) {
	return {
		id: notification.id,
		source: 'notification',
		type: notification.type,
		category: getCategoryFromType(notification.type),
		title: getTitleFromType(notification.type),
		message: notification.message,
		asset: notification.relatedEntityType ? `${notification.relatedEntityType}${notification.relatedEntityId ? ` · ${notification.relatedEntityId}` : ''}` : 'System notice',
		timestamp: formatTime(notification.createdAt),
		unread: !notification.isRead,
		request: false,
		relatedEntityType: notification.relatedEntityType,
		relatedEntityId: notification.relatedEntityId,
		tag: getTagFromType(notification.type),
		tagVariant: getTagVariantFromType(notification.type)
	};
}

function serializeTransferRequest(request) {
	const fromDepartment = request.fromEmployee?.department?.name || 'assigned department';
	const toDepartment = request.toEmployee?.department?.name || 'target department';
	const actorName = request.fromEmployee?.name || 'Employee';

	return {
		id: `transfer-${request.id}`,
		source: 'transfer-request',
		type: 'TRANSFER_REQUESTED',
		category: 'approval',
		title: 'Asset Transfer Request',
		message: `${actorName} requested transfer of '${request.asset?.name || request.asset?.tag || 'an asset'}' from ${fromDepartment} to ${toDepartment}.`,
		asset: request.asset ? `${request.asset.tag}${request.asset.name ? ` · ${request.asset.name}` : ''}` : 'Transfer request',
		timestamp: formatTime(request.createdAt),
		unread: true,
		request: true,
		relatedEntityType: 'TransferRequest',
		relatedEntityId: request.id,
		tag: 'Pending',
		tagVariant: 'warning'
	};
}

function serializeActivityLog(entry) {
	const metadata = entry.metadata || {};
	const label = entry.action.replace(/_/g, ' ').toLowerCase();

	return {
		id: entry.id,
		group: 'Today',
		icon: criticalTypes.has(entry.action) ? 'alert' : bookingTypes.has(entry.action) ? 'booking' : maintenanceTypes.has(entry.action) ? 'maintenance' : 'system',
		title: metadata.title || label.charAt(0).toUpperCase() + label.slice(1),
		description: metadata.description || `${entry.entityType} ${entry.entityId}`,
		actor: entry.actor?.name || 'System',
		entity: `${entry.entityType} · ${entry.entityId}`,
		timestamp: formatTime(entry.createdAt),
		tag: metadata.tag || 'Activity',
		tagVariant: metadata.tagVariant || 'default'
	};
}

function parseLimit(value, fallback) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function listNotifications(req, res) {
	try {
		const limit = parseLimit(req.query.limit, 50);
		const recipientId = req.query.recipientId || undefined;
		const unread = req.query.unread;
		const search = String(req.query.search || '').trim().toLowerCase();

		const notificationWhere = {};
		if (recipientId) {
			notificationWhere.recipientId = recipientId;
		}
		if (unread === 'true') {
			notificationWhere.isRead = false;
		} else if (unread === 'false') {
			notificationWhere.isRead = true;
		}

		const [notifications, transferRequests, activityLogs] = await Promise.all([
			prisma.notification.findMany({
				where: notificationWhere,
				orderBy: { createdAt: 'desc' },
				take: limit,
				include: {
					recipient: true
				}
			}),
			prisma.transferRequest.findMany({
				where: { status: 'REQUESTED' },
				orderBy: { createdAt: 'desc' },
				take: limit,
				include: {
					asset: true,
					fromEmployee: {
						include: { department: true }
					},
					toEmployee: {
						include: { department: true }
					}
				}
			}),
			prisma.activityLog.findMany({
				orderBy: { createdAt: 'desc' },
				take: 20,
				include: { actor: true }
			})
		]);

		const feed = [...notifications.map(serializeNotification), ...transferRequests.map(serializeTransferRequest)]
			.filter((item) => {
				if (!search) {
					return true;
				}

				return [item.title, item.message, item.asset, item.tag, item.category]
					.some((field) => String(field).toLowerCase().includes(search));
			})
			.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

		const stats = {
			total: feed.length,
			unread: notifications.filter((notification) => !notification.isRead).length + transferRequests.length,
			critical: notifications.filter((notification) => criticalTypes.has(notification.type)).length,
			approvals: transferRequests.length,
			bookings: notifications.filter((notification) => bookingTypes.has(notification.type)).length,
			maintenance: notifications.filter((notification) => maintenanceTypes.has(notification.type)).length
		};

		const viewCounts = {
			all: feed.length,
			critical: feed.filter((item) => item.category === 'critical').length,
			approval: feed.filter((item) => item.category === 'approval').length,
			booking: feed.filter((item) => item.category === 'booking').length,
			maintenance: feed.filter((item) => item.category === 'maintenance').length
		};

		res.json({
			notifications: feed,
			activityLogs: activityLogs.map(serializeActivityLog),
			stats,
			viewCounts
		});
	} catch (error) {
		console.error('Failed to load notifications:', error);
		res.status(500).json({ error: 'Failed to load notifications' });
	}
}

async function updateNotificationReadState(req, res) {
	try {
		const { id } = req.params;
		const { isRead = true } = req.body || {};

		const notification = await prisma.notification.update({
			where: { id },
			data: { isRead: Boolean(isRead) }
		});

		res.json({ notification: serializeNotification(notification) });
	} catch (error) {
		console.error('Failed to update notification state:', error);
		res.status(500).json({ error: 'Failed to update notification state' });
	}
}

async function markAllNotificationsRead(req, res) {
	try {
		const recipientId = req.body?.recipientId || req.query.recipientId || undefined;

		const result = await prisma.notification.updateMany({
			where: recipientId ? { recipientId } : {},
			data: { isRead: true }
		});

		res.json({ updatedCount: result.count });
	} catch (error) {
		console.error('Failed to mark notifications read:', error);
		res.status(500).json({ error: 'Failed to mark notifications read' });
	}
}

async function resolveTransferRequest(req, res) {
	try {
		const { id } = req.params;
		const decision = String(req.body?.decision || '').toUpperCase();
		const actorId = req.body?.actorId || req.body?.toEmployeeId;

		if (!['APPROVED', 'REJECTED'].includes(decision)) {
			return res.status(400).json({ error: 'decision must be APPROVED or REJECTED' });
		}

		const request = await prisma.transferRequest.findUnique({
			where: { id },
			include: {
				asset: true,
				fromEmployee: {
					include: { department: true }
				},
				toEmployee: {
					include: { department: true }
				}
			}
		});

		if (!request) {
			return res.status(404).json({ error: 'Transfer request not found' });
		}

		const updatedRequest = await prisma.transferRequest.update({
			where: { id },
			data: {
				status: decision,
				approvedById: decision === 'APPROVED' ? actorId || request.toEmployeeId : request.approvedById
			}
		});

		await prisma.activityLog.create({
			data: {
				actorId,
				action: decision === 'APPROVED' ? 'TRANSFER_APPROVED' : 'TRANSFER_REJECTED',
				entityType: 'TransferRequest',
				entityId: request.id,
				metadata: {
					title: decision === 'APPROVED' ? 'Transfer approved' : 'Transfer rejected',
					description: `${request.asset.tag} transfer ${decision.toLowerCase()} by approver.`,
					assetTag: request.asset.tag,
					assignee: request.toEmployee.name,
					tag: decision === 'APPROVED' ? 'Approved' : 'Rejected',
					tagVariant: decision === 'APPROVED' ? 'success' : 'danger'
				}
			}
		});

		res.json({
			transferRequest: updatedRequest
		});
	} catch (error) {
		console.error('Failed to resolve transfer request:', error);
		res.status(500).json({ error: 'Failed to resolve transfer request' });
	}
}

module.exports = {
	listNotifications,
	updateNotificationReadState,
	markAllNotificationsRead,
	resolveTransferRequest
};
