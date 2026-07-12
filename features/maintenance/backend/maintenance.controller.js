const prisma = require('../../../shared/database');

const ALLOWED_STATUS_UPDATES = ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED'];

async function getMaintenanceRequests(req, res) {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        asset: { select: { id: true, tag: true, name: true, status: true } },
        raisedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load maintenance requests.' });
  }
}

async function getMaintainableAssets(req, res) {
  try {
    const assets = await prisma.asset.findMany({
      where: { status: { notIn: ['RETIRED', 'DISPOSED'] } },
      select: { id: true, tag: true, name: true, location: true, status: true },
      orderBy: { name: 'asc' }
    });
    return res.json({ assets });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load assets.' });
  }
}

async function createMaintenanceRequest(req, res) {
  const { assetId, raisedById, issueDescription, priority, photoUrl } = req.body;
  const requestOwnerId = req.user.employeeId;

  if (!assetId || !issueDescription?.trim()) {
    return res.status(400).json({ error: 'assetId and issueDescription are required.' });
  }

  if (raisedById && raisedById !== requestOwnerId) {
    return res.status(403).json({ error: 'You can only raise maintenance requests for yourself.' });
  }

  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  if (priority && !priorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid maintenance priority.' });
  }

  try {
    const asset = await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        raisedById: requestOwnerId,
        issueDescription: issueDescription.trim(),
        priority: priority || 'MEDIUM',
        photoUrl: photoUrl || null,
        status: 'PENDING'
      },
      include: {
        asset: { select: { id: true, tag: true, name: true, status: true } },
        raisedBy: { select: { id: true, name: true, email: true } }
      }
    });

    return res.status(201).json({ request });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create maintenance request.' });
  }
}

async function updateMaintenanceStatus(req, res) {
  const { requestId } = req.params;
  const { newStatus } = req.body;

  if (!ALLOWED_STATUS_UPDATES.includes(newStatus)) {
    return res.status(400).json({ error: 'newStatus must be APPROVED, REJECTED, IN_PROGRESS, or RESOLVED.' });
  }

  try {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      select: { id: true, assetId: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Maintenance request not found.' });
    }

    let updatedRequest;

    if (newStatus === 'APPROVED' || newStatus === 'IN_PROGRESS') {
      [, updatedRequest] = await prisma.$transaction([
        prisma.asset.update({
          where: { id: request.assetId },
          data: { status: 'UNDER_MAINTENANCE' }
        }),
        prisma.maintenanceRequest.update({
          where: { id: requestId },
          data: {
            status: newStatus,
            ...(newStatus === 'APPROVED' ? { approvedById: req.user.employeeId } : {})
          },
          include: {
            asset: { select: { id: true, tag: true, name: true, status: true } },
            raisedBy: { select: { id: true, name: true, email: true } }
          }
        })
      ]);
    } else if (newStatus === 'RESOLVED') {
      [, updatedRequest] = await prisma.$transaction([
        prisma.asset.update({
          where: { id: request.assetId },
          data: { status: 'AVAILABLE' }
        }),
        prisma.maintenanceRequest.update({
          where: { id: requestId },
          data: { status: 'RESOLVED', resolvedAt: new Date() },
          include: {
            asset: { select: { id: true, tag: true, name: true, status: true } },
            raisedBy: { select: { id: true, name: true, email: true } }
          }
        })
      ]);
    } else {
      updatedRequest = await prisma.maintenanceRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
        include: {
          asset: { select: { id: true, tag: true, name: true, status: true } },
          raisedBy: { select: { id: true, name: true, email: true } }
        }
      });
    }

    return res.json({ request: updatedRequest });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update maintenance status.' });
  }
}

module.exports = {
  getMaintenanceRequests,
  getMaintainableAssets,
  createMaintenanceRequest,
  updateMaintenanceStatus
};
