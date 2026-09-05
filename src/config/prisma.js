const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

require('dotenv').config({ 
  path: process.env.NODE_ENV === 'production' 
    ? path.resolve('.env.production')
    : path.resolve('.env.development'),
  override: true
});

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL 
});
 
const prisma = new PrismaClient({ adapter });

module.exports = prisma;