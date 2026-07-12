const prisma = require('./index');
const bcrypt = require('bcrypt');

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function seed() {
  const assetCount = await prisma.asset.count();

  if (assetCount > 0) {
    console.log('Dashboard seed skipped because assets already exist.');
    return;
  }

  const now = new Date();
  const demoPasswordHash = await bcrypt.hash('Password123!', 10);

  await prisma.$transaction(async (tx) => {
    const categories = {
      laptops: await tx.assetCategory.create({
        data: {
          name: 'Laptops',
          description: 'Portable workstations for corporate staff.'
        }
      }),
      fleet: await tx.assetCategory.create({
        data: {
          name: 'Fleet Vehicles',
          description: 'Vehicles used for field operations and travel.'
        }
      }),
      servers: await tx.assetCategory.create({
        data: {
          name: 'Servers',
          description: 'Infrastructure hardware for internal systems.'
        }
      })
    };

    const employees = {
      admin: await tx.employee.create({
        data: {
          name: 'Amina Yusuf',
          email: 'admin@assetflow.local',
          passwordHash: demoPasswordHash,
          role: 'ADMIN'
        }
      }),
      jane: await tx.employee.create({
        data: {
          name: 'Jane Doe',
          email: 'jane.doe@assetflow.local',
          passwordHash: demoPasswordHash,
          role: 'EMPLOYEE'
        }
      }),
      moses: await tx.employee.create({
        data: {
          name: 'Moses Okafor',
          email: 'moses.okafor@assetflow.local',
          passwordHash: demoPasswordHash,
          role: 'ASSET_MANAGER'
        }
      }),
      lina: await tx.employee.create({
        data: {
          name: 'Lina Patel',
          email: 'lina.patel@assetflow.local',
          passwordHash: demoPasswordHash,
          role: 'EMPLOYEE'
        }
      })
    };

    const assets = {
      laptopAvailable: await tx.asset.create({
        data: {
          tag: 'IT-802',
          name: 'Laptop Pro 14',
          categoryId: categories.laptops.id,
          serialNumber: 'LP14-000802',
          location: 'HQ - IT Room',
          isBookable: true,
          status: 'AVAILABLE'
        }
      }),
      laptopAllocated: await tx.asset.create({
        data: {
          tag: 'IT-4055',
          name: 'Laptop Pro 16',
          categoryId: categories.laptops.id,
          serialNumber: 'LP16-004055',
          location: 'Finance Wing',
          isBookable: true,
          status: 'ALLOCATED'
        }
      }),
      vehicleAllocated: await tx.asset.create({
        data: {
          tag: 'VH-112',
          name: 'Fleet Vehicle',
          categoryId: categories.fleet.id,
          serialNumber: 'VH-00112',
          location: 'Logistics Yard',
          isBookable: true,
          status: 'ALLOCATED'
        }
      }),
      serverMaintenance: await tx.asset.create({
        data: {
          tag: 'SRV-104',
          name: 'Database Server Rack',
          categoryId: categories.servers.id,
          serialNumber: 'SRV-104-AX1',
          location: 'Datacenter 1',
          isBookable: false,
          status: 'UNDER_MAINTENANCE'
        }
      })
    };

    const allocations = {
      activeLaptop: await tx.allocation.create({
        data: {
          assetId: assets.laptopAllocated.id,
          employeeId: employees.jane.id,
          expectedReturnDate: addDays(now, 3),
          status: 'ACTIVE',
          conditionNotes: 'Issued with charger and docking station.'
        }
      }),
      overdueVehicle: await tx.allocation.create({
        data: {
          assetId: assets.vehicleAllocated.id,
          employeeId: employees.moses.id,
          expectedReturnDate: addDays(now, -2),
          status: 'ACTIVE',
          conditionNotes: 'Vehicle return has been delayed.'
        }
      })
    };

    await tx.booking.createMany({
      data: [
        {
          assetId: assets.laptopAvailable.id,
          bookedById: employees.lina.id,
          purpose: 'Quarterly planning session',
          startTime: addDays(now, 1),
          endTime: addDays(now, 1.5),
          status: 'UPCOMING'
        },
        {
          assetId: assets.laptopAllocated.id,
          bookedById: employees.jane.id,
          purpose: 'Client presentation',
          startTime: addDays(now, -0.5),
          endTime: addDays(now, 0.5),
          status: 'ONGOING'
        }
      ]
    });

    await tx.maintenanceRequest.create({
      data: {
        assetId: assets.serverMaintenance.id,
        raisedById: employees.admin.id,
        issueDescription: 'Server fan is noisy and requires inspection.',
        priority: 'HIGH',
        status: 'PENDING'
      }
    });

    await tx.transferRequest.create({
      data: {
        assetId: assets.laptopAvailable.id,
        fromEmployeeId: employees.admin.id,
        toEmployeeId: employees.lina.id,
        reason: 'Move equipment to design team',
        status: 'REQUESTED'
      }
    });

    const auditCycle = await tx.auditCycle.create({
      data: {
        name: 'Mid-Year Asset Audit',
        scopeLocation: 'HQ Campus',
        startDate: addDays(now, -1),
        endDate: addDays(now, 6),
        status: 'OPEN'
      }
    });

    await tx.auditItem.createMany({
      data: [
        {
          auditCycleId: auditCycle.id,
          assetId: assets.laptopAvailable.id,
          expectedLocation: 'HQ - IT Room',
          verification: 'VERIFIED',
          verifiedById: employees.admin.id,
          notes: 'Device present and accounted for.'
        },
        {
          auditCycleId: auditCycle.id,
          assetId: assets.vehicleAllocated.id,
          expectedLocation: 'Logistics Yard',
          verification: 'MISSING',
          verifiedById: employees.moses.id,
          notes: 'Vehicle not found during scheduled audit.'
        }
      ]
    });

    await tx.activityLog.createMany({
      data: [
        {
          actorId: employees.jane.id,
          action: 'ASSET_ALLOCATED',
          entityType: 'Allocation',
          entityId: allocations.activeLaptop.id,
          metadata: {
            assetTag: assets.laptopAllocated.tag,
            assignee: employees.jane.name,
            description: 'Laptop Pro 16 assigned for client presentation.'
          },
          createdAt: addDays(now, -0.01)
        },
        {
          actorId: employees.admin.id,
          action: 'MAINTENANCE_SCHEDULED',
          entityType: 'MaintenanceRequest',
          entityId: assets.serverMaintenance.id,
          metadata: {
            assetTag: assets.serverMaintenance.tag,
            location: assets.serverMaintenance.location,
            description: 'Database server marked for inspection.'
          },
          createdAt: addDays(now, -0.03)
        },
        {
          actorId: employees.moses.id,
          action: 'TRANSFER_REQUESTED',
          entityType: 'TransferRequest',
          entityId: assets.laptopAvailable.id,
          metadata: {
            assetTag: assets.laptopAvailable.tag,
            assignee: employees.lina.name,
            description: 'Transfer requested for design team equipment.'
          },
          createdAt: addDays(now, -0.08)
        },
        {
          actorId: employees.admin.id,
          action: 'AUDIT_DISCREPANCY',
          entityType: 'AuditItem',
          entityId: assets.vehicleAllocated.id,
          metadata: {
            assetTag: assets.vehicleAllocated.tag,
            description: 'Vehicle missing during mid-year audit.'
          },
          createdAt: addDays(now, -0.12)
        },
        {
          actorId: employees.lina.id,
          action: 'BOOKING_CONFIRMED',
          entityType: 'Booking',
          entityId: assets.laptopAvailable.id,
          metadata: {
            assetTag: assets.laptopAvailable.tag,
            description: 'Planning session booking confirmed.'
          },
          createdAt: addDays(now, -0.18)
        }
      ]
    });

    await tx.notification.createMany({
      data: [
        {
          recipientId: employees.jane.id,
          type: 'ASSET_ASSIGNED',
          message: 'Laptop Pro 16 has been assigned to you.',
          relatedEntityType: 'Allocation',
          relatedEntityId: allocations.activeLaptop.id
        },
        {
          recipientId: employees.moses.id,
          type: 'OVERDUE_RETURN',
          message: 'Fleet Vehicle return is overdue.',
          relatedEntityType: 'Allocation',
          relatedEntityId: allocations.overdueVehicle.id
        }
      ]
    });
  });

  console.log('Dashboard demo data seeded successfully.');
}

seed()
  .catch((error) => {
    console.error('Failed to seed dashboard demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });