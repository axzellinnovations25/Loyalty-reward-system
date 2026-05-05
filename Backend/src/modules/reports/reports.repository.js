const { Prisma } = require('@prisma/client');
const db = require('../../config/db');

async function summary(shopId, { from, to }) {
  const dateFilter = {
    ...(from && { gte: new Date(from) }),
    ...(to   && { lte: new Date(to) }),
  };

  const [
    totalCustomers,
    totalPurchases,
    totalRedemptions,
    revenueAgg,
    pointsAgg,
  ] = await Promise.all([
    db.customer.count({ where: { shopId } }),
    db.purchase.count({ where: { shopId, createdAt: dateFilter } }),
    db.redemption.count({ where: { shopId, createdAt: dateFilter } }),
    db.purchase.aggregate({ where: { shopId, createdAt: dateFilter }, _sum: { amount: true } }),
    db.customer.aggregate({ where: { shopId }, _sum: { totalPoints: true } }),
  ]);

  return {
    totalCustomers,
    totalPurchases,
    totalRedemptions,
    totalRevenue: revenueAgg._sum.amount ?? 0,
    totalPointsOutstanding: pointsAgg._sum.totalPoints ?? 0,
  };
}

async function topCustomers(shopId, { limit = 10 }) {
  return db.purchase.groupBy({
    by: ['customerId'],
    where: { shopId },
    _sum: { amount: true, pointsEarned: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
    take: Number(limit),
  });
}

async function purchasesByDay(shopId, { from, to }) {
  const conditions = [Prisma.sql`"shopId" = ${shopId}::uuid`];
  
  if (from) {
    conditions.push(Prisma.sql`AND "createdAt" >= ${new Date(from)}`);
  }
  if (to) {
    conditions.push(Prisma.sql`AND "createdAt" <= ${new Date(to)}`);
  }

  const whereClause = Prisma.join(conditions, ' ');

  return db.$queryRaw`
    SELECT DATE("createdAt") as day, COUNT(*) as count, SUM(amount) as revenue
    FROM "Purchase"
    WHERE ${whereClause}
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;
}

module.exports = { summary, topCustomers, purchasesByDay };
