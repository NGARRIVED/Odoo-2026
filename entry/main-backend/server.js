const path = require('path');
const dotenv = require('dotenv');

const envPaths = [path.resolve(__dirname, '../../.env'), path.resolve(process.cwd(), '.env')];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

const express = require('express');
const cors = require('cors');
const prisma = require('../../shared/database');

const authRoutes = require('../../features/authentication/backend');
const dashboardRoutes = require('../../features/dashboard/backend');
const orgSetupRoutes = require('../../features/organization-setup/backend');
const assetRoutes = require('../../features/assets/backend');
const allocationRoutes = require('../../features/allocation-transfer/backend');
const bookingRoutes = require('../../features/resource-booking/backend');
const maintenanceRoutes = require('../../features/maintenance/backend');
const auditRoutes = require('../../features/audit/backend');
const reportsRoutes = require('../../features/reports-analytics/backend');
const notificationRoutes = require('../../features/notifications/backend');
const landingRoutes = require('../../features/landing-page/backend');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/organization', orgSetupRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/landing', landingRoutes);

app.locals.prisma = prisma;

const PORT = process.env.PORT || 4000;

if (require.main === module) {
	const server = app.listen(PORT, () => console.log(`AssetFlow API running on port ${PORT}`));

	server.on('error', (error) => {
		if (error.code === 'EADDRINUSE') {
			console.error(`AssetFlow API could not start: port ${PORT} is already in use.`);
			console.error('Stop the existing backend process, or set a different PORT in entry/main-backend/.env.');
		} else {
			console.error('AssetFlow API failed to start:', error.message);
		}

		process.exit(1);
	});
}

module.exports = app;
