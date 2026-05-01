export type DashboardSummary = {
  totalCustomers: number;
  totalPurchases: number;
  totalRedemptions: number;
  totalRevenue: number;
  totalPointsOutstanding: number;
};

export type DayStats = {
  day: string;
  count: number;
  revenue: number;
};

export type TopCustomerStats = {
  customerId: string;
  _sum: {
    amount: number;
    pointsEarned: number;
  };
  _count: number;
};
