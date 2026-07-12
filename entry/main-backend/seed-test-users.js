const prisma = require('../../shared/database');
const bcrypt = require('bcryptjs');

async function seed() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@assetflow.local', name: 'System Admin', role: 'ADMIN' },
    { email: 'manager@assetflow.local', name: 'Asset Manager', role: 'ASSET_MANAGER' },
    { email: 'head@assetflow.local', name: 'Department Head', role: 'DEPARTMENT_HEAD' },
    { email: 'employee@assetflow.local', name: 'Regular Employee', role: 'EMPLOYEE' }
  ];

  for (const user of users) {
    await prisma.employee.upsert({
      where: { email: user.email },
      update: { role: user.role, passwordHash },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
        status: 'ACTIVE'
      }
    });
    console.log(`Upserted ${user.email} as ${user.role}`);
  }
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
