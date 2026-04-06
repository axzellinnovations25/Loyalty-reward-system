'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'Missing admin credentials. Set ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD in your .env file.'
    );
  }

  console.log('Seeding admin user...');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await db.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},                      // do NOT overwrite if already exists
    create: {
      name:         ADMIN_NAME || 'Admin',
      email:        ADMIN_EMAIL,
      passwordHash,
    },
  });

  console.log(`  ✓ Admin created: ${admin.email}`);
  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
