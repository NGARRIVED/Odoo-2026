const prisma = require('../../../shared/database');

async function getDashboardSummary(req, res) {
  try {
    const [totalAssets, availableAssets, activeAllocations, pendingMaintenance] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.allocation.count({ where: { status: 'ACTIVE' } }),
      prisma.maintenanceRequest.count({ where: { status: 'PENDING' } })
    ]);

    // Calculate total value
    const assets = await prisma.asset.findMany({ select: { acquisitionCost: true } });
    const totalValue = assets.reduce((sum, a) => sum + (Number(a.acquisitionCost) || 0), 0);

    return res.json({
      totalAssets,
      availableAssets,
      activeAllocations,
      pendingMaintenance,
      totalValue
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch summary.' });
  }
}

async function getAssetsByStatus(req, res) {
  try {
    const counts = await prisma.asset.groupBy({
      by: ['status'],
      _count: { id: true }
    });
    return res.json({ data: counts.map(c => ({ name: c.status, value: c._count.id })) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch status data.' });
  }
}

async function getAssetsByCategory(req, res) {
  try {
    const categories = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true }
        }
      }
    });
    return res.json({ data: categories.map(c => ({ name: c.name, value: c._count.assets })) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch category data.' });
  }
}

module.exports = { getDashboardSummary, getAssetsByStatus, getAssetsByCategory };
