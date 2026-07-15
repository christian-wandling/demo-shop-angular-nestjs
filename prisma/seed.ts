import { seedUsers } from './seeds/user.seed';
import { PrismaClient } from '@prisma/client';
import { seedProducts } from './seeds/product.seed';
import { seedOrders } from './seeds/order.seed';
import * as process from 'node:process';

const DEFAULT_TARGETS = ['users', 'products', 'orders'];

async function seed() {
  const targets = (process.env.SEED_TARGETS ?? DEFAULT_TARGETS.join(','))
    .split(',')
    .map(target => target.trim())
    .filter(Boolean);

  const prisma = new PrismaClient();

  try {
    let users: Awaited<ReturnType<typeof seedUsers>> = [];
    let products: Awaited<ReturnType<typeof seedProducts>> = [];

    if (targets.includes('users')) {
      users = await seedUsers(prisma);
    }

    if (targets.includes('products')) {
      products = await seedProducts(prisma);
    }

    if (targets.includes('orders')) {
      await seedOrders(prisma, users, products);
    }

    await prisma.$disconnect();
    console.log('Seeding completed successfully');
  } catch (err) {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seed().catch(err => {
  console.error(err);
});
