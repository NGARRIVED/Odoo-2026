const prisma = require('../../../shared/database');

const VERIFICATION_STATUSES = ['VERIFIED', 'MISSING', 'DAMAGED'];

async function getActiveAuditCycle(req, res) {
  try {
    const cycle = await prisma.auditCycle.findFirst({
      where: { status: 'OPEN' },
      include: {
        items: {
          include: {
            asset: { select: { id: true, tag: true, name: true, location: true, status: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    return res.json({ cycle });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load the active audit cycle.' });
  }
}

async function updateAuditItem(req, res) {
  const { itemId } = req.params;
  const { verification } = req.body;

  if (!VERIFICATION_STATUSES.includes(verification)) {
    return res.status(400).json({ error: 'verification must be VERIFIED, MISSING, or DAMAGED.' });
  }

  try {
    const item = await prisma.auditItem.update({
      where: { id: itemId },
      data: {
        verification,
        verifiedById: req.user.employeeId
      },
      include: {
        asset: { select: { id: true, tag: true, name: true, location: true, status: true } }
      }
    });

    return res.json({ item });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Audit item not found.' });
    }
    return res.status(500).json({ error: 'Failed to update audit item.' });
  }
}

async function closeAuditCycle(req, res) {
  const { cycleId } = req.params;

  try {
    const cycle = await prisma.auditCycle.findUnique({
      where: { id: cycleId },
      select: { id: true, status: true }
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Audit cycle not found.' });
    }
    if (cycle.status === 'CLOSED') {
      return res.status(409).json({ error: 'This audit cycle is already closed.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const missingItems = await tx.auditItem.findMany({
        where: { auditCycleId: cycleId, verification: 'MISSING' },
        select: { assetId: true }
      });

      const missingAssetIds = missingItems.map((item) => item.assetId);
      if (missingAssetIds.length > 0) {
        await tx.asset.updateMany({
          where: { id: { in: missingAssetIds } },
          data: { status: 'LOST' }
        });
      }

      const closedCycle = await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: 'CLOSED' }
      });

      return { closedCycle, lostAssetCount: new Set(missingAssetIds).size };
    });

    return res.json({ cycle: result.closedCycle, lostAssetCount: result.lostAssetCount });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to close audit cycle and sync the asset ledger.' });
  }
}

module.exports = { getActiveAuditCycle, updateAuditItem, closeAuditCycle };
