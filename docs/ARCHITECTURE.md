# AssetFlow — Architecture

This document is the single reference for how data is modeled (`shared/database/prisma/schema.prisma`) and how the two entry points (`entry/main-frontend`, `entry/main-backend`) wire every feature together. Feature-level business logic lives inside each `features/*/backend` and `features/*/frontend` folder — this file only covers the shared schema and the thin entry layer.

---

## 1. Feature Ownership Map

| Feature folder | Primary tables owned | Reads from |
|---|---|---|
| `authentication` | `Employee` (auth fields) | — |
| `organization-setup` | `Department`, `AssetCategory`, `Employee` (role/status) | — |
| `assets` | `Asset` | `AssetCategory`, `Department` |
| `allocation-transfer` | `Allocation`, `TransferRequest` | `Asset`, `Employee`, `Department` |
| `resource-booking` | `Booking` | `Asset` |
| `maintenance` | `MaintenanceRequest` | `Asset`, `Employee` |
| `audit` | `AuditCycle`, `AuditCycleAuditor`, `AuditItem` | `Asset`, `Employee`, `Department` |
| `reports-analytics` | (read-only) | all of the above |
| `notifications` | `Notification`, `ActivityLog` | all of the above (write-side, fan-in) |
| `landing-page` | none | — |
| `dashboard` | (read-only aggregation) | all of the above |

Rule of thumb: a feature may **write** to the tables it owns and may **read** any table it needs for display. Cross-feature writes (e.g. maintenance approval flipping `Asset.status`) go through a shared service call, never a raw query into another feature's table — this keeps `git blame` and ownership honest even though Prisma technically allows it.

---

## 2. Database Schema — `shared/database/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum Role {
  ADMIN
  ASSET_MANAGER
  DEPARTMENT_HEAD
  EMPLOYEE
}

enum StatusFlag {
  ACTIVE
  INACTIVE
}

enum AssetStatus {
  AVAILABLE
  ALLOCATED
  RESERVED
  UNDER_MAINTENANCE
  LOST
  RETIRED
  DISPOSED
}

enum AllocationStatus {
  ACTIVE
  RETURNED
  OVERDUE
}

enum TransferStatus {
  REQUESTED
  APPROVED
  REJECTED
  COMPLETED
}

enum BookingStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MaintenanceStatus {
  PENDING
  APPROVED
  REJECTED
  TECHNICIAN_ASSIGNED
  IN_PROGRESS
  RESOLVED
}

enum AuditVerification {
  PENDING
  VERIFIED
  MISSING
  DAMAGED
}

enum AuditCycleStatus {
  OPEN
  CLOSED
}

enum NotificationType {
  ASSET_ASSIGNED
  MAINTENANCE_APPROVED
  MAINTENANCE_REJECTED
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  BOOKING_REMINDER
  TRANSFER_APPROVED
  OVERDUE_RETURN
  AUDIT_DISCREPANCY
}

// ─────────────────────────────────────────────
// ORGANIZATION SETUP  (feature: organization-setup)
// ─────────────────────────────────────────────

model Department {
  id            String       @id @default(cuid())
  name          String
  headId        String?      @unique
  head          Employee?    @relation("DepartmentHead", fields: [headId], references: [id])
  parentId      String?
  parent        Department?  @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children      Department[] @relation("DepartmentHierarchy")
  status        StatusFlag   @default(ACTIVE)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  employees     Employee[]        @relation("EmployeeDepartment")
  assets        Asset[]
  allocations   Allocation[]
  auditCycles   AuditCycle[]
}

model Employee {
  id             String       @id @default(cuid())
  name           String
  email          String       @unique
  passwordHash   String
  role           Role         @default(EMPLOYEE)
  status         StatusFlag   @default(ACTIVE)
  departmentId   String?
  department     Department?  @relation("EmployeeDepartment", fields: [departmentId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  headOfDept        Department?         @relation("DepartmentHead")
  allocations       Allocation[]        @relation("AllocationHolder")
  transfersFrom      TransferRequest[]  @relation("TransferFrom")
  transfersTo        TransferRequest[]  @relation("TransferTo")
  transfersApproved  TransferRequest[]  @relation("TransferApprover")
  bookings           Booking[]
  maintenanceRaised  MaintenanceRequest[] @relation("MaintenanceRaisedBy")
  maintenanceApproved MaintenanceRequest[] @relation("MaintenanceApprovedBy")
  auditCyclesAssigned AuditCycleAuditor[]
  auditItemsVerified  AuditItem[]        @relation("AuditVerifier")
  notifications      Notification[]
  activityLogs       ActivityLog[]
}

model AssetCategory {
  id            String   @id @default(cuid())
  name          String   @unique
  description   String?
  customFields  Json?    // e.g. { "warrantyPeriodMonths": 24 }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  assets        Asset[]
}

// ─────────────────────────────────────────────
// ASSETS  (feature: assets)
// ─────────────────────────────────────────────

model Asset {
  id               String        @id @default(cuid())
  tag              String        @unique   // auto-generated, e.g. AF-0001
  name             String
  categoryId       String
  category         AssetCategory @relation(fields: [categoryId], references: [id])
  serialNumber     String?       @unique
  qrCode           String?       @unique
  acquisitionDate  DateTime?
  acquisitionCost  Decimal?      @db.Decimal(12, 2)   // reporting/ranking only, never linked to accounting
  condition        String?
  location         String?
  photoUrl         String?
  isBookable       Boolean       @default(false)
  status           AssetStatus   @default(AVAILABLE)
  departmentId     String?
  department       Department?   @relation(fields: [departmentId], references: [id])
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  allocations         Allocation[]
  transferRequests     TransferRequest[]
  bookings             Booking[]
  maintenanceRequests  MaintenanceRequest[]
  auditItems           AuditItem[]

  @@index([status])
  @@index([categoryId])
}

// ─────────────────────────────────────────────
// ALLOCATION & TRANSFER  (feature: allocation-transfer)
// ─────────────────────────────────────────────

model Allocation {
  id                 String            @id @default(cuid())
  assetId            String
  asset              Asset             @relation(fields: [assetId], references: [id])
  employeeId         String
  employee           Employee          @relation("AllocationHolder", fields: [employeeId], references: [id])
  departmentId       String?
  department         Department?       @relation(fields: [departmentId], references: [id])
  allocatedDate      DateTime          @default(now())
  expectedReturnDate DateTime?
  actualReturnDate   DateTime?
  conditionNotes     String?
  status             AllocationStatus  @default(ACTIVE)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  // One asset can only have ONE ACTIVE allocation at a time — enforced in
  // allocation.controller.js (application-level check, since Prisma can't
  // express "unique where status = ACTIVE" as a plain constraint).

  @@index([assetId, status])
}

model TransferRequest {
  id           String         @id @default(cuid())
  assetId      String
  asset        Asset          @relation(fields: [assetId], references: [id])
  fromEmployeeId String
  fromEmployee Employee       @relation("TransferFrom", fields: [fromEmployeeId], references: [id])
  toEmployeeId String
  toEmployee   Employee       @relation("TransferTo", fields: [toEmployeeId], references: [id])
  reason       String?
  status       TransferStatus @default(REQUESTED)
  approvedById String?
  approvedBy   Employee?      @relation("TransferApprover", fields: [approvedById], references: [id])
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}

// ─────────────────────────────────────────────
// RESOURCE BOOKING  (feature: resource-booking)
// ─────────────────────────────────────────────

model Booking {
  id          String        @id @default(cuid())
  assetId     String                        // the bookable asset/resource (Asset.isBookable = true)
  asset       Asset         @relation(fields: [assetId], references: [id])
  bookedById  String
  bookedBy    Employee      @relation(fields: [bookedById], references: [id])
  purpose     String?
  startTime   DateTime
  endTime     DateTime
  status      BookingStatus @default(UPCOMING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Overlap validation (no two bookings for the same assetId with
  // overlapping [startTime, endTime) while status != CANCELLED) is enforced
  // in booking.controller.js before insert.

  @@index([assetId, startTime, endTime])
}

// ─────────────────────────────────────────────
// MAINTENANCE  (feature: maintenance)
// ─────────────────────────────────────────────

model MaintenanceRequest {
  id               String              @id @default(cuid())
  assetId          String
  asset            Asset               @relation(fields: [assetId], references: [id])
  raisedById       String
  raisedBy         Employee            @relation("MaintenanceRaisedBy", fields: [raisedById], references: [id])
  issueDescription String
  priority         MaintenancePriority @default(MEDIUM)
  photoUrl         String?
  status           MaintenanceStatus   @default(PENDING)
  approvedById     String?
  approvedBy       Employee?           @relation("MaintenanceApprovedBy", fields: [approvedById], references: [id])
  technicianName   String?
  resolvedAt       DateTime?
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  @@index([assetId, status])
}

// ─────────────────────────────────────────────
// AUDIT  (feature: audit)
// ─────────────────────────────────────────────

model AuditCycle {
  id                 String            @id @default(cuid())
  name               String
  scopeDepartmentId  String?
  scopeDepartment    Department?       @relation(fields: [scopeDepartmentId], references: [id])
  scopeLocation      String?
  startDate          DateTime
  endDate            DateTime
  status             AuditCycleStatus  @default(OPEN)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt

  auditors  AuditCycleAuditor[]
  items     AuditItem[]
}

model AuditCycleAuditor {
  auditCycleId String
  auditCycle   AuditCycle @relation(fields: [auditCycleId], references: [id])
  employeeId   String
  employee     Employee   @relation(fields: [employeeId], references: [id])

  @@id([auditCycleId, employeeId])
}

model AuditItem {
  id               String            @id @default(cuid())
  auditCycleId     String
  auditCycle       AuditCycle        @relation(fields: [auditCycleId], references: [id])
  assetId          String
  asset            Asset             @relation(fields: [assetId], references: [id])
  expectedLocation String?
  verification     AuditVerification @default(PENDING)
  verifiedById     String?
  verifiedBy       Employee?         @relation("AuditVerifier", fields: [verifiedById], references: [id])
  notes            String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@index([auditCycleId, verification])
}

// ─────────────────────────────────────────────
// NOTIFICATIONS & ACTIVITY LOG  (feature: notifications)
// ─────────────────────────────────────────────

model Notification {
  id               String           @id @default(cuid())
  recipientId      String
  recipient        Employee         @relation(fields: [recipientId], references: [id])
  type             NotificationType
  message          String
  relatedEntityType String?         // e.g. "Asset", "Booking", "MaintenanceRequest"
  relatedEntityId  String?
  isRead           Boolean          @default(false)
  createdAt        DateTime         @default(now())

  @@index([recipientId, isRead])
}

model ActivityLog {
  id         String   @id @default(cuid())
  actorId    String
  actor      Employee @relation(fields: [actorId], references: [id])
  action     String   // e.g. "ASSET_ALLOCATED", "MAINTENANCE_APPROVED"
  entityType String
  entityId   String
  metadata   Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
}
```

### Entity-relationship summary

```
Department ──1:N── Employee ──1:N── Allocation ──N:1── Asset ──N:1── AssetCategory
    │                  │                                   │
    │                  ├──1:N── TransferRequest (from/to)  ├──1:N── Booking
    │                  ├──1:N── Booking                    ├──1:N── MaintenanceRequest
    │                  ├──1:N── MaintenanceRequest          └──1:N── AuditItem
    │                  ├──N:N── AuditCycleAuditor ──N:1── AuditCycle
    │                  ├──1:N── Notification
    │                  └──1:N── ActivityLog
    └──1:N── AuditCycle
```

### Key application-level rules not expressible as plain SQL constraints

| Rule | Enforced in |
|---|---|
| An asset can have only one `ACTIVE` allocation at a time (double-allocation block) | `features/allocation-transfer/backend/allocation.controller.js` |
| A booking cannot overlap an existing non-cancelled booking on the same asset | `features/resource-booking/backend/booking.controller.js` |
| `Asset.status` flips to `UNDER_MAINTENANCE` only on maintenance **approval**, and back to `AVAILABLE` only on **resolution** | `features/maintenance/backend/maintenance.controller.js` |
| `Allocation.status` flips to `OVERDUE` when `expectedReturnDate < now()` and no `actualReturnDate` | scheduled job in `features/allocation-transfer/backend/` + read in `features/dashboard/backend` |
| Closing an `AuditCycle` locks all its `AuditItem`s and sets `Asset.status = LOST` for confirmed-`MISSING` items | `features/audit/backend/audit.controller.js` |
| Role promotion (`Employee.role` → `DEPARTMENT_HEAD` / `ASSET_MANAGER`) only happens from Organization Setup, never at signup | `features/authentication/backend` only ever writes `role = EMPLOYEE`; `features/organization-setup/backend/employee.controller.js` is the only place that updates `role` afterward |

---

## 3. Entry Point Setup

### 3.1 `entry/main-backend/server.js`

Stays thin — mounts each feature's router and nothing else. All business logic lives in the feature's own `controller.js`.

```js
const express = require('express');
const cors = require('cors');
const prisma = require('../../shared/database'); // shared Prisma client singleton

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AssetFlow API running on port ${PORT}`));
```

Every feature's `backend/index.js` follows the same shape:

```js
// features/assets/backend/index.js
const express = require('express');
const router = express.Router();
const controller = require('./asset.controller');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');

router.get('/', requireAuth, controller.list);
router.get('/:id', requireAuth, controller.getOne);
router.post('/', requireAuth, requireRole(['ADMIN', 'ASSET_MANAGER']), controller.register);
router.patch('/:id', requireAuth, requireRole(['ADMIN', 'ASSET_MANAGER']), controller.update);

module.exports = router;
```

`auth.middleware.js` is the one shared cross-feature import — every other feature's router pulls `requireAuth`/`requireRole` from `authentication/backend`, since role-based access control is one concern that legitimately spans all features.

### 3.2 `entry/main-frontend/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from '../../features/authentication/frontend/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

### 3.3 `entry/main-frontend/App.jsx`

Route declarations only — no business logic, no data fetching.

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../shared/utils/ProtectedRoute';

import LandingPage from '../../features/landing-page/frontend';
import { Login, Signup, ForgotPassword } from '../../features/authentication/frontend';
import Dashboard from '../../features/dashboard/frontend';
import OrganizationSetup from '../../features/organization-setup/frontend';
import Assets from '../../features/assets/frontend';
import AllocationTransfer from '../../features/allocation-transfer/frontend';
import ResourceBooking from '../../features/resource-booking/frontend';
import Maintenance from '../../features/maintenance/frontend';
import Audit from '../../features/audit/frontend';
import ReportsAnalytics from '../../features/reports-analytics/frontend';
import Notifications from '../../features/notifications/frontend';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Authenticated */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/organization-setup" element={<ProtectedRoute roles={['ADMIN']}><OrganizationSetup /></ProtectedRoute>} />
        <Route path="/assets/*" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/allocations/*" element={<ProtectedRoute><AllocationTransfer /></ProtectedRoute>} />
        <Route path="/bookings/*" element={<ProtectedRoute><ResourceBooking /></ProtectedRoute>} />
        <Route path="/maintenance/*" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
        <Route path="/audit/*" element={<ProtectedRoute roles={['ADMIN', 'ASSET_MANAGER']}><Audit /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsAnalytics /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 3.4 `shared/database/index.js` — single Prisma client instance

```js
const { PrismaClient } = require('@prisma/client');

// Prevents multiple PrismaClient instances during dev hot-reload
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = prisma;
```

---

## 4. Setup Checklist

1. `npm install` at root (installs workspaces for `shared/*`, `features/*/backend`, `entry/*`).
2. Set `DATABASE_URL` in `.env`.
3. `cd shared/database && npx prisma migrate dev --name init`
4. `npx prisma generate`
5. `npm run dev --workspace=entry/main-backend`
6. `npm run dev --workspace=entry/main-frontend`
