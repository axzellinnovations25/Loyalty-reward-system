'use strict';

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
  // Raw aggregation — adjust for your DB dialect as needed
  return db.$queryRaw`
    SELECT DATE("createdAt") as day, COUNT(*) as count, SUM(amount) as revenue
    FROM "Purchase"
    WHERE "shopId" = ${shopId}
      ${from ? db.$raw`AND "createdAt" >= ${new Date(from)}` : db.$raw``}
      ${to   ? db.$raw`AND "createdAt" <= ${new Date(to)}`   : db.$raw``}
    GROUP BY DATE("createdAt")
    ORDER BY day ASC
  `;
}

module.exports = { summary, topCustomers, purchasesByDay };
