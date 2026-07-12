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

function formatCurrency(value) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD'
	}).format(Number(value || 0));
}

function bucketDates(startDate, endDate, bucketCount) {
	const buckets = [];
	const totalMs = endDate.getTime() - startDate.getTime();
	const bucketMs = totalMs / bucketCount;

	for (let index = 0; index < bucketCount; index += 1) {
		const bucketStart = new Date(startDate.getTime() + bucketMs * index);
		const bucketEnd = index === bucketCount - 1 ? endDate : new Date(startDate.getTime() + bucketMs * (index + 1));
		buckets.push({ bucketStart, bucketEnd, value: 0 });
	}

	return buckets;
}

function assignToBuckets(records, bucketCount, startDate, endDate) {
	const buckets = bucketDates(startDate, endDate, bucketCount);
	const totalMs = endDate.getTime() - startDate.getTime();
	const bucketSize = totalMs / bucketCount || 1;

	records.forEach((record) => {
		const value = record instanceof Date ? record : new Date(record);
		if (Number.isNaN(value.getTime()) || value < startDate || value > endDate) {
			return;
		}

		const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((value.getTime() - startDate.getTime()) / bucketSize)));
		buckets[index].value += 1;
	});

	return buckets;
}

function bucketLabels(startDate, endDate, bucketCount) {
	const buckets = bucketDates(startDate, endDate, bucketCount);

	return buckets.map((bucket) => {
		const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(bucket.bucketStart);
		const day = bucket.bucketStart.getDate();
		return `${month} ${day}`;
	});
}

function buildUtilizationBreakdown(categories) {

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
		const departmentFilter = department !== 'all' ? { departmentId: department } : {};
	const assetDepartmentFilter = department !== 'all' ? { departmentId: department } : {};
	const scopedFilter = buildDepartmentScope(department);

		const [departments, totalAssets, availableAssets, allocatedAssets, maintenanceAssets, activeBookings, pendingTransfers, criticalAlerts, maintenanceRequests, allocations, categories, oldestAssets] = await Promise.all([
			prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
			prisma.asset.count({ where: departmentFilter }),
			prisma.asset.count({ where: { ...departmentFilter, status: 'AVAILABLE' } }),
			prisma.allocation.count({ where: { ...departmentFilter, status: 'ACTIVE' } }),
			prisma.maintenanceRequest.count({ where: { ...departmentFilter, status: { in: ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'] } } }),
			prisma.booking.count({ where: { ...departmentFilter, status: { in: ['UPCOMING', 'ONGOING'] } } }),
			prisma.transferRequest.count({ where: { status: 'REQUESTED' } }),
			prisma.notification.count({ where: { type: { in: ['OVERDUE_RETURN', 'AUDIT_DISCREPANCY'] } } }),
			prisma.maintenanceRequest.findMany({
				where: {
					createdAt: { gte: startDate },
					...departmentFilter
				},
				select: { createdAt: true }
			}),
			prisma.allocation.findMany({
				where: {
					allocatedDate: { gte: startDate },
					...departmentFilter
				},
				select: { allocatedDate: true }
			}),
			prisma.assetCategory.findMany({
				orderBy: { name: 'asc' },
				include: {
					assets: {
						where: departmentFilter,
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
				where: departmentFilter,
				orderBy: [
					{ acquisitionDate: 'asc' },
					{ createdAt: 'asc' }
				],
				take: 6,
				include: { category: true }
			})
		]);

		const utilizationRate = totalAssets ? Math.round((allocatedAssets / totalAssets) * 100) : 0;
		const criticalPending = criticalAlerts + maintenanceRequests.filter((request) => request.priority === 'CRITICAL').length;
		const utilizationSeries = assignToBuckets(allocations.map((allocation) => allocation.allocatedDate), 6, startDate, endDate).map((bucket) => bucket.value);
		const maintenanceSeries = assignToBuckets(maintenanceRequests.map((request) => request.createdAt), 6, startDate, endDate).map((bucket) => bucket.value);
		const chartLabels = bucketLabels(startDate, endDate, 6);
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
					trend: `${criticalPending.toLocaleString()} critical`
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
				labels: chartLabels,
				values: maintenanceSeries
			},
			utilizationSeries: {
				labels: utilizationBreakdown.map((item) => item.label),
				values: utilizationBreakdown.map((item) => item.utilization)
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
