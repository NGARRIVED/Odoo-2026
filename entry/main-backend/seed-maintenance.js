const prisma = require('../../shared/database');

async function seedMaintenance() {
  const employee = await prisma.employee.findFirst({ where: { role: 'EMPLOYEE' } });
  const manager = await prisma.employee.findFirst({ where: { role: 'ASSET_MANAGER' } });

  const asset1 = await prisma.asset.findFirst({ where: { tag: 'VEH-001' } });
  const asset2 = await prisma.asset.findFirst({ where: { tag: 'EQ-001' } });

  if (!employee || !manager || !asset1 || !asset2) {
    console.log("Missing prerequisites for seeding maintenance.");
    return;
  }

  // Create PENDING request
  await prisma.maintenanceRequest.create({
    data: {
      assetId: asset1.id,
      raisedById: employee.id,
      issueDescription: 'Engine making strange rattling noise.',
      priority: 'HIGH',
      status: 'PENDING'
    }
  });

  // Create IN_PROGRESS request (requires updating asset status to UNDER_MAINTENANCE)
  await prisma.$transaction([
    prisma.maintenanceRequest.create({
      data: {
        assetId: asset2.id,
        raisedById: manager.id,
        issueDescription: 'Projector bulb flickers randomly.',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        approvedById: manager.id,
        technicianName: 'Bob the Builder'
      }
    }),
    prisma.asset.update({
      where: { id: asset2.id },
      data: { status: 'UNDER_MAINTENANCE' }
    })
  ]);

  console.log("Maintenance records seeded successfully.");
}

seedMaintenance()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
