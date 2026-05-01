const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
  {
    name: 'Coffee',
    imageKeyword: 'coffee',
    products: ['Espresso', 'Americano', 'Latte', 'Cappuccino', 'Mocha', 'Flat White'],
  },
  {
    name: 'Pastry',
    imageKeyword: 'pastry',
    products: ['Croissant', 'Blueberry Muffin', 'Chocolate Chip Cookie', 'Cinnamon Roll', 'Brownie'],
  },
  {
    name: 'Beverage',
    imageKeyword: 'drink',
    products: ['Iced Tea', 'Lemonade', 'Orange Juice', 'Sparkling Water', 'Strawberry Smoothie'],
  },
  {
    name: 'Sandwich',
    imageKeyword: 'sandwich',
    products: ['Turkey Club', 'BLT', 'Grilled Cheese', 'Tuna Salad', 'Chicken Wrap'],
  },
  {
    name: 'Salad',
    imageKeyword: 'salad',
    products: ['Caesar Salad', 'Greek Salad', 'Cobb Salad', 'Quinoa Salad', 'Fruit Bowl'],
  },
  {
    name: 'Snack',
    imageKeyword: 'snack',
    products: ['Potato Chips', 'Mixed Nuts', 'Pretzels', 'Popcorn', 'Granola Bar'],
  },
  {
    name: 'Dessert',
    imageKeyword: 'dessert',
    products: ['Cheesecake', 'Tiramisu', 'Gelato', 'Apple Pie', 'Panna Cotta'],
  },
  {
    name: 'Breakfast',
    imageKeyword: 'breakfast',
    products: ['Pancakes', 'Waffles', 'Avocado Toast', 'Oatmeal', 'Breakfast Burrito'],
  },
  {
    name: 'Merchandise',
    imageKeyword: 'merch',
    products: ['Coffee Mug', 'Tote Bag', 'T-Shirt', 'Cap', 'Coffee Beans (250g)'],
  },
  {
    name: 'Add-ons',
    imageKeyword: 'syrup',
    products: ['Extra Espresso Shot', 'Vanilla Syrup', 'Oat Milk', 'Almond Milk', 'Caramel Drizzle'],
  },
];

async function main() {
  console.log('Seeding 50+ products with images...');

  // 1. Get all shops
  const shops = await prisma.shop.findMany();
  if (shops.length === 0) {
    console.error('No Shops found. Please run the base seed script first.');
    process.exit(1);
  }
  
  let count = 0;

  for (const shop of shops) {
    console.log(`Using Shop: ${shop.name} (${shop.id})`);

    // 2. Loop through categories and create products
    for (const catData of categories) {
    // Upsert Category
    const category = await prisma.productCategory.upsert({
      where: {
        shopId_name: { shopId: shop.id, name: catData.name },
      },
      update: {},
      create: {
        shopId: shop.id,
        name: catData.name,
      },
    });

    // Seed products for this category
    for (const [index, prodName] of catData.products.entries()) {
      const sku = `SKU-${catData.name.substring(0, 3).toUpperCase()}-${index + 1}`;
      const basePrice = Math.floor(Math.random() * 800) + 200; // Between 200 and 1000

      // Use an image service that gives realistic placeholders
      // Adding sku to the URL prevents caching the exact same image
      const imageUrl = `https://loremflickr.com/400/400/${catData.imageKeyword}?lock=${count}`;

      await prisma.product.upsert({
        where: {
          shopId_sku: { shopId: shop.id, sku },
        },
        update: {
          imageUrl, // Update the image just in case
          categoryId: category.id,
        },
        create: {
          shopId: shop.id,
          categoryId: category.id,
          name: prodName,
          sku,
          description: `Fresh and delicious ${prodName.toLowerCase()}.`,
          price: basePrice,
          cost: basePrice * 0.4, // 40% cost margin
          stockOnHand: 100,
          trackInventory: true,
          imageUrl,
        },
      });
      count++;
    }
  }
  }

  console.log(`Successfully seeded ${count} products with images!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
