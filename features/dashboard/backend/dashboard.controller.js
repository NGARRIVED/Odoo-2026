const prisma = require('../../../shared/database');

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function formatRelativeDate(value) {
  const date = new Date(value);
  const now = new Date();
  const diffInHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 0) {
    const daysOverdue = Math.abs(Math.ceil(diffInHours / 24));
    return `${daysOverdue} day${daysOverdue === 1 ? '' : 's'} overdue`;
  }

  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} left`;
  }

  const daysLeft = Math.ceil(diffInHours / 24);
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
}

function buildActivityLabel(action) {
  const labels = {
    ASSET_ALLOCATED: 'Asset Checked Out',
    MAINTENANCE_SCHEDULED: 'Maintenance Scheduled',
    TRANSFER_COMPLETED: 'Transfer Completed',
    AUDIT_DISCREPANCY: 'Audit Discrepancy',
    BOOKING_CONFIRMED: 'Booking Confirmed',
    TRANSFER_REQUESTED: 'Transfer Requested'
  };

  return labels[action] || action.replace(/_/g, ' ').toLowerCase();
}

function buildActivityDescription(entry) {
  const metadata = entry.metadata || {};

  if (metadata.description) {
    return metadata.description;
  }

  const parts = [];

  if (metadata.assetTag) {
    parts.push(metadata.assetTag);
  }

  if (metadata.assignee) {
    parts.push(`assigned to ${metadata.assignee}`);
  }

  if (metadata.location) {
    parts.push(`at ${metadata.location}`);
  }

  if (parts.length > 0) {
    return parts.join(' ');
  }

  return `${entry.entityType} ${entry.entityId}`;
}

const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const upcomingWindow = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);

    const [
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceAssets,
      activeBookings,
      pendingTransfers,
      upcomingReturns,
      overdueAssets,
      recentAllocations,
      recentActivity,
      overdueItems,
      totalEmployees
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.allocation.count({ where: { status: 'ACTIVE' } }),
      prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } }),
      prisma.booking.count({ where: { status: { in: ['UPCOMING', 'ONGOING'] } } }),
      prisma.transferRequest.count({ where: { status: 'REQUESTED' } }),
      prisma.allocation.count({
        where: {
          status: 'ACTIVE',
          actualReturnDate: null,
          expectedReturnDate: {
            gte: now,
            lte: upcomingWindow
          }
        }
      }),
      prisma.allocation.count({
        where: {
          status: 'ACTIVE',
          actualReturnDate: null,
          expectedReturnDate: { lt: now }
        }
      }),
      prisma.allocation.findMany({
        take: 5,
        orderBy: { allocatedDate: 'desc' },
        include: {
          asset: {
            include: {
              category: true
            }
          },
          employee: true
        }
      }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: true
        }
      }),
      prisma.allocation.findMany({
        where: {
          status: 'ACTIVE',
          actualReturnDate: null,
          expectedReturnDate: { lt: now }
        },
        take: 3,
        orderBy: { expectedReturnDate: 'asc' },
        include: {
          asset: {
            include: {
              category: true
            }
          },
          employee: true
        }
      }),
      prisma.employee.count()
    ]);

    res.json({
      metrics: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        activeBookings,
        pendingTransfers,
        upcomingReturns,
        totalEmployees
      },
      overview: {
        overdueAssets
      },
      recentAllocations: recentAllocations.map((allocation) => ({
        id: allocation.id,
        assetTag: allocation.asset.tag,
        assetType: allocation.asset.category.name,
        assignee: allocation.employee.name,
        status: allocation.status,
        date: allocation.allocatedDate
      })),
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        title: buildActivityLabel(entry.action),
        description: buildActivityDescription(entry),
        timestamp: entry.createdAt,
        actor: entry.actor.name
      })),
      overdueItems: overdueItems.map((allocation) => ({
        id: allocation.id,
        assetTag: allocation.asset.tag,
        assetType: allocation.asset.category.name,
        assignee: allocation.employee.name,
        dueDate: allocation.expectedReturnDate,
        overdueLabel: formatRelativeDate(allocation.expectedReturnDate)
      })),
      generatedAt: formatDateTime(new Date())
    });
  } catch (error) {
    console.error('Failed to load dashboard summary:', error);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
};

module.exports = {
  getSummary
};
