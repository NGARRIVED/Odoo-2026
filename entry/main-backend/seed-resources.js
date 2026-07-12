const prisma = require('../../shared/database');

async function seedBookableResources() {
  // Upsert categories
  const roomCategory = await prisma.assetCategory.upsert({
    where: { name: 'Meeting Rooms' },
    update: {},
    create: { name: 'Meeting Rooms', description: 'Conference and meeting rooms.' }
  });

  const vehicleCategory = await prisma.assetCategory.upsert({
    where: { name: 'Fleet Vehicles' },
    update: {},
    create: { name: 'Fleet Vehicles', description: 'Company cars and vans.' }
  });

  const equipmentCategory = await prisma.assetCategory.upsert({
    where: { name: 'Shared Equipment' },
    update: {},
    create: { name: 'Shared Equipment', description: 'Projectors, PA systems, etc.' }
  });

  // Resources
  const resources = [
    { tag: 'ROOM-101', name: 'Boardroom Alpha', location: 'Floor 1', categoryId: roomCategory.id, isBookable: true, status: 'AVAILABLE' },
    { tag: 'ROOM-102', name: 'Huddle Space Beta', location: 'Floor 1', categoryId: roomCategory.id, isBookable: true, status: 'AVAILABLE' },
    { tag: 'ROOM-201', name: 'Training Room', location: 'Floor 2', categoryId: roomCategory.id, isBookable: true, status: 'AVAILABLE' },
    { tag: 'VEH-001', name: 'Toyota Prius (Blue)', location: 'Basement Parking', categoryId: vehicleCategory.id, isBookable: true, status: 'AVAILABLE' },
    { tag: 'VEH-002', name: 'Ford Transit Van', location: 'Loading Dock', categoryId: vehicleCategory.id, isBookable: true, status: 'AVAILABLE' },
    { tag: 'EQ-001', name: 'Epson 4K Projector', location: 'IT Storage', categoryId: equipmentCategory.id, isBookable: true, status: 'AVAILABLE' },
    { tag: 'EQ-002', name: 'JBL PA System', location: 'IT Storage', categoryId: equipmentCategory.id, isBookable: true, status: 'AVAILABLE' },
  ];

  for (const r of resources) {
    await prisma.asset.upsert({
      where: { tag: r.tag },
      update: { isBookable: true },
      create: r
    });
    console.log(`Upserted bookable resource: ${r.tag} - ${r.name}`);
  }

  console.log("Bookable resources seeded successfully.");
}

seedBookableResources()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
