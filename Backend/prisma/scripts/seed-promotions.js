'use strict';

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const shop = await db.shop.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!shop) {
    console.log('No shop found. Create a shop/user first, then re-run.');
    return;
  }

  const examples = [
    {
      name: '10% off (SAVE10)',
      kind: 'cart_percent',
      isActive: true,
      priority: 50,
      stackable: false,
      couponCode: 'SAVE10',
      usageLimit: 1000,
      perCustomerLimit: 1,
      config: { percent: 10, maxDiscount: 5000, minSubtotal: 1000 },
    },
    {
      name: 'Happy Hour: Rs. 99 selected items',
      kind: 'happy_hour_price',
      isActive: true,
      priority: 10,
      stackable: true,
      startTime: '17:00',
      endTime: '19:00',
      config: { price: 99, productIds: [] },
    },
    {
      name: 'BOGO: Buy 2 get 1 free (selected)',
      kind: 'bogo',
      isActive: true,
      priority: 20,
      stackable: true,
      config: { buyQty: 2, getQty: 1, percentOff: 100, productIds: [] },
    },
  ];

  for (const ex of examples) {
    await db.promotion.create({
      data: {
        shopId: shop.id,
        ...ex,
        description: ex.name,
        daysOfWeek: [],
      },
    });
    console.log(`✓ ${ex.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

