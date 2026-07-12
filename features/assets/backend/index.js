const express = require('express');
const prisma = require('../../../shared/database');

const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const [
			totalAssets,
			availableAssets,
			allocatedAssets,
			maintenanceAssets,
			assets
		] = await Promise.all([
			prisma.asset.count(),
			prisma.asset.count({ where: { status: 'AVAILABLE' } }),
			prisma.asset.count({ where: { status: 'ALLOCATED' } }),
			prisma.asset.count({ where: { status: 'UNDER_MAINTENANCE' } }),
			prisma.asset.findMany({
				orderBy: { updatedAt: 'desc' },
				include: {
					category: true,
					allocations: {
						where: { status: 'ACTIVE' },
						take: 1,
						orderBy: { allocatedDate: 'desc' },
						include: {
							employee: true
						}
					}
				}
			})
		]);

		res.json({
			metrics: {
				totalAssets,
				availableAssets,
				allocatedAssets,
				maintenanceAssets
			},
			assets: assets.map((asset) => ({
				id: asset.id,
				tag: asset.tag,
				name: asset.name,
				category: asset.category.name,
				status: asset.status,
				location: asset.location || 'Unassigned',
				isBookable: asset.isBookable,
				condition: asset.condition || 'Unknown',
				serialNumber: asset.serialNumber,
				updatedAt: asset.updatedAt,
				allocatedTo: asset.allocations[0]?.employee?.name || null
			}))
		});
	} catch (error) {
		console.error('Failed to load assets:', error);
		res.status(500).json({ error: 'Failed to load assets' });
	}
});

module.exports = router;
