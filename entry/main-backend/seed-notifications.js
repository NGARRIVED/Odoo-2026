const prisma = require('../../shared/database');

async function seedNotifications() {
  const admin = await prisma.employee.findFirst({ where: { role: 'ADMIN' } });
  const manager = await prisma.employee.findFirst({ where: { role: 'ASSET_MANAGER' } });
  const employee = await prisma.employee.findFirst({ where: { role: 'EMPLOYEE' } });

  const users = [admin, manager, employee].filter(Boolean);

  for (const user of users) {
    await prisma.notification.createMany({
      data: [
        {
          recipientId: user.id,
          type: 'ASSET_ASSIGNED',
          message: 'You have been assigned a new asset: MacBook Pro 16".',
          isRead: false
        },
        {
          recipientId: user.id,
          type: 'MAINTENANCE_APPROVED',
          message: 'Your maintenance request for Toyota Prius has been approved.',
          isRead: true
        },
        {
          recipientId: user.id,
          type: 'BOOKING_REMINDER',
          message: 'Reminder: You have a booking for Boardroom Alpha in 1 hour.',
          isRead: false
        }
      ]
    });
  }

  console.log('Seeded notifications for test users.');
}

seedNotifications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
