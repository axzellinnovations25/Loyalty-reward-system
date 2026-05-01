export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForceChangePassword: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  CustomersTab: undefined;
  PosTab: undefined;
  GiftCardsTab: undefined;
  MoreTab: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
};

export type CustomersStackParamList = {
  CustomersHome: undefined;
  CustomerDetail: { id: string };
};

export type PurchasesStackParamList = {
  PurchasesHome: undefined;
  NewPurchase: undefined;
};

export type GiftCardsStackParamList = {
  GiftCardsHome: undefined;
  ScanGiftCard: undefined;
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Rewards: undefined;
  Messages: undefined;
  Users: undefined;
  Settings: undefined;
  Purchases: undefined;
};
