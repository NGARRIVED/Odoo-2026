const prisma = require('../../../shared/database');

const PERIOD_CONFIG = {
	'30d': { days: 30, label: 'Last 30 Days' },
	quarter: { days: 90, label: 'Last Quarter' },
	ytd: { days: 365, label: 'Year to Date' }
};

function getPeriodConfig(period) {
	return PERIOD_CONFIG[period] || PERIOD_CONFIG['30d'];
}

function startOfDay(date) {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

function addDays(date, days) {
	return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function buildDepartmentScope(department) {
	if (department === 'all') {
		return {};
	}

	return {
		OR: [
			{ departmentId: department },
			{ asset: { departmentId: department } }
		]
	};
}

function bucketLabels(startDate, endDate, bucketCount) {
	const totalMs = Math.max(1, endDate.getTime() - startDate.getTime());
	const bucketMs = totalMs / bucketCount;

	return Array.from({ length: bucketCount }, (_, index) => {
		const bucketStart = new Date(startDate.getTime() + bucketMs * index);
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric'
		}).format(bucketStart);
	});
}

function bucketSeries(dates, startDate, endDate, bucketCount) {
	const totalMs = Math.max(1, endDate.getTime() - startDate.getTime());
	const bucketMs = totalMs / bucketCount;
	const values = Array.from({ length: bucketCount }, () => 0);

	dates.forEach((value) => {
		const current = new Date(value);
		if (Number.isNaN(current.getTime()) || current < startDate || current > endDate) {
			return;
		}

		const bucketIndex = Math.min(bucketCount - 1, Math.max(0, Math.floor((current.getTime() - startDate.getTime()) / bucketMs)));
		values[bucketIndex] += 1;
	});

	return values;
}

function buildUtilizationBreakdown(categories) {
	return categories
		.map((category) => {
			const activeAllocations = category.assets.reduce((count, asset) => count + asset.allocations.length, 0);
			const totalAssets = category.assets.length;
			const utilization = totalAssets ? Math.round((activeAllocations / totalAssets) * 100) : 0;

			return {
				label: category.name,
				utilization,
				idle: Math.max(0, 100 - utilization)
			};
		})
		.sort((left, right) => right.utilization - left.utilization)
		.slice(0, 6);
}

async function getSummary(req, res) {
	try {
		const period = String(req.query.period || '30d');
		const department = String(req.query.department || 'all');
		const periodConfig = getPeriodConfig(period);
		const endDate = startOfDay(new Date());
		const startDate = addDays(endDate, -periodConfig.days);
		const assetScope = department === 'all' ? {} : { departmentId: department };
		const relationScope = buildDepartmentScope(department);

		const [departments, totalAssets, availableAssets, allocatedAssets, maintenanceAssets, activeBookings, pendingTransfers, criticalNotifications, criticalMaintenanceCount, maintenanceRequests, allocations, categories, oldestAssets] = await Promise.all([
			prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
			prisma.asset.count({ where: assetScope }),
			prisma.asset.count({ where: { ...assetScope, status: 'AVAILABLE' } }),
			prisma.allocation.count({ where: { ...relationScope, status: 'ACTIVE' } }),
			prisma.maintenanceRequest.count({ where: { ...relationScope, status: { in: ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'] } } }),
			prisma.booking.count({ where: { ...relationScope, status: { in: ['UPCOMING', 'ONGOING'] } } }),
			prisma.transferRequest.count({ where: { status: 'REQUESTED' } }),
			prisma.notification.count({ where: { type: { in: ['OVERDUE_RETURN', 'AUDIT_DISCREPANCY'] } } }),
			prisma.maintenanceRequest.count({ where: { ...relationScope, priority: 'CRITICAL', status: { not: 'RESOLVED' } } }),
			prisma.maintenanceRequest.findMany({
				where: {
					createdAt: { gte: startDate },
					...relationScope
				},
				select: { createdAt: true }
			}),
			prisma.allocation.findMany({
				where: {
					allocatedDate: { gte: startDate },
					...relationScope
				},
				select: { allocatedDate: true }
			}),
			prisma.assetCategory.findMany({
				orderBy: { name: 'asc' },
				include: {
					assets: {
						where: assetScope,
						include: {
							allocations: {
								where: { status: 'ACTIVE' },
								take: 1,
								select: { id: true }
							}
						}
					}
				}
			}),
			prisma.asset.findMany({
				where: assetScope,
				orderBy: [
					{ acquisitionDate: 'asc' },
					{ createdAt: 'asc' }
				],
				take: 6,
				include: { category: true }
			})
		]);

		const utilizationRate = totalAssets ? Math.round((allocatedAssets / totalAssets) * 100) : 0;
		const criticalAlerts = criticalNotifications + criticalMaintenanceCount;
		const maintenanceTrend = bucketSeries(maintenanceRequests.map((request) => request.createdAt), startDate, endDate, 6);
		const utilizationBreakdown = buildUtilizationBreakdown(categories);

		res.json({
			summaryCards: [
				{
					label: 'Total Active Assets',
					value: totalAssets.toLocaleString(),
					hint: `${periodConfig.label} · ${department === 'all' ? 'All Departments' : departments.find((item) => item.id === department)?.name || 'Selected Department'}`,
					trend: `${availableAssets.toLocaleString()} available`
				},
				{
					label: 'Avg. Utilization Rate',
					value: `${utilizationRate}%`,
					hint: 'Average across tracked departments',
					trend: `${allocatedAssets.toLocaleString()} active allocations`
				},
				{
					label: 'Maintenance Pending',
					value: maintenanceAssets.toLocaleString(),
					hint: 'Open maintenance requests and inspections',
					trend: `${criticalMaintenanceCount.toLocaleString()} critical`
				},
				{
					label: 'Critical Alerts',
					value: criticalAlerts.toLocaleString(),
					hint: 'Requires immediate action',
					trend: `${pendingTransfers.toLocaleString()} pending transfers`
				}
			],
			utilizationBreakdown,
			maintenanceSeries: {
				labels: bucketLabels(startDate, endDate, 6),
				values: maintenanceTrend
			},
			retirementRows: oldestAssets.map((asset, index) => ({
				assetId: asset.tag,
				category: asset.category?.name || 'Asset',
				location: asset.location || 'Unassigned',
				cost: Number(asset.acquisitionCost || 0),
				status: asset.status === 'RETIRED' || asset.status === 'DISPOSED' ? 'Retired' : index === 0 ? 'Critical' : index === 1 ? 'Warning' : 'Scheduled',
				action: index === 2 ? 'Review' : 'Initiate Procurement'
			})),
			departments: departments.map((departmentRow) => ({
				label: departmentRow.name,
				value: departmentRow.id
			})),
			generatedAt: new Date().toISOString()
		});
	} catch (error) {
		console.error('Failed to load reports summary:', error);
		res.status(500).json({ error: 'Failed to load reports summary' });
	}
}

module.exports = {
	getSummary
};
