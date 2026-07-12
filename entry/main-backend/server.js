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

// Safely mount routes with type checking
const routes = [
  { path: '/api/auth', handler: authRoutes },
  { path: '/api/dashboard', handler: dashboardRoutes },
  { path: '/api/organization', handler: orgSetupRoutes },
  { path: '/api/assets', handler: assetRoutes },
  { path: '/api/allocations', handler: allocationRoutes },
  { path: '/api/bookings', handler: bookingRoutes },
  { path: '/api/maintenance', handler: maintenanceRoutes },
  { path: '/api/audits', handler: auditRoutes },
  { path: '/api/reports', handler: reportsRoutes },
  { path: '/api/notifications', handler: notificationRoutes },
  { path: '/api/landing', handler: landingRoutes }
];

routes.forEach(route => {
  try {
    if (route.handler && typeof route.handler === 'object' && route.handler._router) {
      app.use(route.path, route.handler);
    } else if (route.handler && typeof route.handler === 'function') {
      app.use(route.path, route.handler);
    }
  } catch (err) {
    console.warn(`Failed to mount route ${route.path}:`, err.message);
  }
});

app.locals.prisma = prisma;

const PORT = process.env.PORT || 4000;

if (require.main === module) {
	app.listen(PORT, () => console.log(`AssetFlow API running on port ${PORT}`));
}

module.exports = app;
