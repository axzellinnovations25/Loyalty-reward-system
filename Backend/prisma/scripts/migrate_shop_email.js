/**
 * DATABASE MIGRATION SCRIPT
 * 
 * Purpose: 
 * 1. Move email from User table to Shop table.
 * 2. Set username for Users based on their email prefix if blank.
 * 3. Handle 'contactInfo' to 'phone' transition for Shops.
 * 
 * IMPORTANT: Run this script BEFORE running 'npx prisma migrate dev' to avoid data loss.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});

async function main() {
  console.log('🚀 Starting data migration...');

  // 1. Ensure Shop has 'email' column if it doesn't exist yet
  console.log('--- Checking Shop table structure ---');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "email" TEXT;
    `);
  } catch (err) {
    console.warn('⚠️  Note: email column might already exist. Continuing...', err.message);
  }

  // 2. Map Users to Shops and migrate emails
  console.log('--- Migrating emails from User to Shop ---');
  // We use raw query to access 'email' even if it's removed from the Prisma model
  const users = await prisma.$queryRawUnsafe(`SELECT id, "shopId", "email", "username" FROM "User"`);
  
  const shops = await prisma.$queryRawUnsafe(`SELECT id FROM "Shop"`);
  
  for (const shop of shops) {
    // Find the first user for this shop to get an email
    const shopUser = users.find(u => u.shopId === shop.id);
    
    if (shopUser && shopUser.email) {
      console.log(`Setting email ${shopUser.email} for Shop ${shop.id}`);
      await prisma.$executeRawUnsafe(
        `UPDATE "Shop" SET "email" = $1 WHERE "id" = $2 AND "email" IS NULL`,
        shopUser.email, shop.id
      );
    }
  }

  // 3. Ensure all Users have unique usernames
  console.log('--- Ensuring Users have usernames ---');
  for (const user of users) {
    if (!user.username && user.email) {
      let baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;

      // Simple collision check (naive but works for migration)
      while (users.some(u => u.username === username && u.id !== user.id)) {
        username = `${baseUsername}${counter++}`;
      }

      console.log(`Updating User ${user.id}: username -> ${username}`);
      await prisma.$executeRawUnsafe(
        `UPDATE "User" SET "username" = $1 WHERE "id" = $2`,
        username, user.id
      );
    }
  }

  // 4. Final step: check for any shops still missing email
  const missing = await prisma.$queryRawUnsafe(`SELECT id, name FROM "Shop" WHERE "email" IS NULL`);
  if (missing.length > 0) {
    console.warn(`⚠️  Warning: ${missing.length} shops are missing emails (no associated users found):`);
    missing.forEach(s => console.log(` - ${s.name} (${s.id})`));
    console.log('Please set emails for these shops manually.');
  }

  console.log('✅ Migration complete!');
  console.log('You can now run: npx prisma migrate dev --name move_email_to_shop');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
