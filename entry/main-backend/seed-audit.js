const prisma = require('../../shared/database');

async function seedAudit() {
  const assets = await prisma.asset.findMany({ take: 5 });
  
  if (assets.length === 0) {
    console.log("No assets found to audit.");
    return;
  }

  // Close any existing open cycles
  await prisma.auditCycle.updateMany({
    where: { status: 'OPEN' },
    data: { status: 'CLOSED' }
  });

  // Create a new OPEN cycle
  const cycle = await prisma.auditCycle.create({
    data: {
      name: 'Q3 Annual IT Asset Audit',
      scopeLocation: 'Headquarters',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'OPEN'
    }
  });

  // Attach items to the cycle
  for (const asset of assets) {
    await prisma.auditItem.create({
      data: {
        auditCycleId: cycle.id,
        assetId: asset.id,
        expectedLocation: asset.location || 'Unknown',
        verification: 'PENDING'
      }
    });
  }

  console.log(`Created audit cycle '${cycle.name}' with ${assets.length} items to verify.`);
}

seedAudit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
