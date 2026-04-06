export interface DashboardSummary {
  totalCustomers: number;
  totalPurchases: number;
  totalRedemptions: number;
  totalRevenue: number;
  totalPointsOutstanding: number;
}

export interface DayStats {
  day: string;
  count: number;
  revenue: number;
}

export interface TopCustomerStats {
  customerId: string;
  _sum: {
    amount: number;
    pointsEarned: number;
  };
  _count: number;
}
