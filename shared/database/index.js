const path = require('path');
const dotenv = require('dotenv');

const envPaths = [path.resolve(__dirname, '../../.env'), path.resolve(process.cwd(), '.env')];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

const { PrismaClient } = require('@prisma/client');

const prisma = globalThis.__assetflowPrisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__assetflowPrisma = prisma;
}

module.exports = prisma;
