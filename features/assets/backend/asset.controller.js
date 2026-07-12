const { Prisma } = require('@prisma/client');
const prisma = require('../../../shared/database');

function mapAsset(asset) {
	return {
		id: asset.id,
		tag: asset.tag,
		name: asset.name,
		categoryId: asset.categoryId,
		category: asset.category?.name || '',
		status: asset.status,
		location: asset.location || 'Unassigned',
		isBookable: asset.isBookable,
		condition: asset.condition || 'Unknown',
		serialNumber: asset.serialNumber,
		qrCode: asset.qrCode,
		acquisitionDate: asset.acquisitionDate,
		acquisitionCost: asset.acquisitionCost,
		departmentId: asset.departmentId,
		updatedAt: asset.updatedAt,
		createdAt: asset.createdAt,
		allocatedTo: asset.allocations?.[0]?.employee?.name || null
	};
}

async function ensureCategory(categoryName, tx = prisma) {
	const name = String(categoryName || '').trim();

	if (!name) {
		throw new Error('Category name is required');
	}

	return tx.assetCategory.upsert({
		where: { name },
		update: {},
		create: { name }
	});
}

async function loadAssetById(id) {
	return prisma.asset.findUnique({
		where: { id },
		include: {
			category: true,
			allocations: {
				orderBy: { allocatedDate: 'desc' },
				include: { employee: true }
			},
			maintenanceRequests: {
				orderBy: { createdAt: 'desc' },
				take: 20,
				include: {
					raisedBy: true,
					approvedBy: true
				}
			},
			bookings: {
				orderBy: { startTime: 'desc' },
				take: 20,
				include: {
					bookedBy: true
				}
			}
		}
	});
}

async function listAssets(req, res) {
	try {
		const assetScope = req.user.role === 'EMPLOYEE'
			? { allocations: { some: { employeeId: req.user.employeeId, status: 'ACTIVE' } } }
			: {};
		const [
			totalAssets,
			availableAssets,
			allocatedAssets,
			maintenanceAssets,
			categories,
			assets
		] = await Promise.all([
			prisma.asset.count({ where: assetScope }),
			prisma.asset.count({ where: { ...assetScope, status: 'AVAILABLE' } }),
			prisma.asset.count({ where: { ...assetScope, status: 'ALLOCATED' } }),
			prisma.asset.count({ where: { ...assetScope, status: 'UNDER_MAINTENANCE' } }),
			prisma.assetCategory.findMany({ orderBy: { name: 'asc' } }),
			prisma.asset.findMany({
				where: assetScope,
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
			categories: categories.map((category) => ({ id: category.id, name: category.name })),
			assets: assets.map(mapAsset)
		});
	} catch (error) {
		console.error('Failed to load assets:', error);
		res.status(500).json({ error: 'Failed to load assets' });
	}
}

async function getAsset(req, res) {
	try {
		const asset = await loadAssetById(req.params.id);

		if (!asset) {
			return res.status(404).json({ error: 'Asset not found' });
		}

		if (req.user.role === 'EMPLOYEE' && !asset.allocations.some((allocation) => allocation.status === 'ACTIVE' && allocation.employeeId === req.user.employeeId)) {
			return res.status(404).json({ error: 'Asset not found' });
		}

		res.json({ asset: mapAsset(asset), details: asset });
	} catch (error) {
		console.error('Failed to load asset:', error);
		res.status(500).json({ error: 'Failed to load asset' });
	}
}

async function createAsset(req, res) {
	try {
		const {
			tag,
			name,
			categoryName,
			status = 'AVAILABLE',
			location,
			condition,
			serialNumber,
			acquisitionDate,
			acquisitionCost,
			isBookable = false,
			qrCode
		} = req.body;

		if (!tag || !name || !categoryName) {
			return res.status(400).json({ error: 'Tag, name, and category are required' });
		}

		const category = await ensureCategory(categoryName);

		const asset = await prisma.asset.create({
			data: {
				tag: tag.trim(),
				name: name.trim(),
				categoryId: category.id,
				status,
				location: location?.trim() || null,
				condition: condition?.trim() || null,
				serialNumber: serialNumber?.trim() || null,
				acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
				acquisitionCost: acquisitionCost ? new Prisma.Decimal(acquisitionCost) : null,
				isBookable: Boolean(isBookable),
				qrCode: qrCode?.trim() || null
			},
			include: {
				category: true,
				allocations: {
					where: { status: 'ACTIVE' },
					take: 1,
					include: { employee: true }
				}
			}
		});

		res.status(201).json({ asset: mapAsset(asset) });
	} catch (error) {
		console.error('Failed to create asset:', error);
		res.status(500).json({ error: error.message || 'Failed to create asset' });
	}
}

async function updateAsset(req, res) {
	try {
		const existingAsset = await prisma.asset.findUnique({ where: { id: req.params.id } });

		if (!existingAsset) {
			return res.status(404).json({ error: 'Asset not found' });
		}

		const {
			tag,
			name,
			categoryName,
			status,
			location,
			condition,
			serialNumber,
			acquisitionDate,
			acquisitionCost,
			isBookable,
			qrCode
		} = req.body;

		let categoryId = existingAsset.categoryId;

		if (categoryName) {
			const category = await ensureCategory(categoryName);
			categoryId = category.id;
		}

		const asset = await prisma.asset.update({
			where: { id: existingAsset.id },
			data: {
				tag: tag?.trim() || existingAsset.tag,
				name: name?.trim() || existingAsset.name,
				categoryId,
				status: status || existingAsset.status,
				location: location === '' ? null : location?.trim() || existingAsset.location,
				condition: condition === '' ? null : condition?.trim() || existingAsset.condition,
				serialNumber: serialNumber === '' ? null : serialNumber?.trim() || existingAsset.serialNumber,
				acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : existingAsset.acquisitionDate,
				acquisitionCost: acquisitionCost ? new Prisma.Decimal(acquisitionCost) : existingAsset.acquisitionCost,
				isBookable: typeof isBookable === 'boolean' ? isBookable : existingAsset.isBookable,
				qrCode: qrCode === '' ? null : qrCode?.trim() || existingAsset.qrCode
			},
			include: {
				category: true,
				allocations: {
					where: { status: 'ACTIVE' },
					take: 1,
					orderBy: { allocatedDate: 'desc' },
					include: { employee: true }
				}
			}
		});

		res.json({ asset: mapAsset(asset) });
	} catch (error) {
		console.error('Failed to update asset:', error);
		res.status(500).json({ error: error.message || 'Failed to update asset' });
	}
}

module.exports = {
	listAssets,
	getAsset,
	createAsset,
	updateAsset
};
