const { PrismaClient } = require('@prisma/client');

const prisma = globalThis.__assetflowPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__assetflowPrisma = prisma;
}

module.exports = prisma;
