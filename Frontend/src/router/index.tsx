/**
 * Requires: npm install react-router-dom
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, useAdminAuth } from '../hooks/useAuth';

import ShopLayout from '../components/layout/ShopLayout';
import AdminLayout from '../components/layout/AdminLayout';

// Shop staff pages
import LoginPage from '../features/auth/LoginPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import CustomerListPage from '../features/customers/CustomerListPage';
import CustomerDetailPage from '../features/customers/CustomerDetailPage';
import NewPurchasePage from '../features/purchases/NewPurchasePage';
import PurchaseListPage from '../features/purchases/PurchaseListPage';
import GiftCardListPage from '../features/giftCards/GiftCardListPage';
import ScanGiftCardPage from '../features/giftCards/ScanGiftCardPage';
import RewardsPage from '../features/rewards/RewardsPage';
import SettingsPage from '../features/settings/SettingsPage';
import UserListPage from '../features/users/UserListPage';
import MessageLogPage from '../features/messages/MessageLogPage';
import ForceChangePasswordPage from '../features/auth/ForceChangePasswordPage';
import ProductListPage from '../features/products/ProductListPage';
import ProductCategoriesPage from '../features/products/ProductCategoriesPage';
import PosPage from '../features/pos/PosPage';
import SalesPage from '../features/sales/SalesPage';
import PromotionsPage from '../features/promotions/PromotionsPage';
import ReportsPage from '../features/reports/ReportsPage';
import InventoryPage from '../features/inventory/InventoryPage';
import ShiftsPage from '../features/shifts/ShiftsPage';
import RedeemPage from '../features/redeem/RedeemPage';
import OperationsPage from '../features/operations/OperationsPage';

// Admin pages
import AdminLoginPage from '../features/admin/auth/AdminLoginPage';
import AdminDashboardPage from '../features/admin/dashboard/AdminDashboardPage';
import ShopsPage from '../features/admin/shops/ShopsPage';
import PlansPage from '../features/admin/plans/PlansPage';
import BillingPage from '../features/admin/billing/BillingPage';

/** Redirect to login if not authenticated. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.forcePasswordChange) return <Navigate to="/force-change-password" replace />;
  return <>{children}</>;
}

function RequireForcePasswordAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.forcePasswordChange) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/** Redirect to admin login if not authenticated. */
function RequireAdminAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

export default function AppRouter() {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Force password change page for staff */}
        <Route 
          path="/force-change-password" 
          element={
            <RequireForcePasswordAuth>
              <ForceChangePasswordPage />
            </RequireForcePasswordAuth>
          } 
        />

        {/* Shop staff — protected */}
        <Route
          path="/*"
          element={
            <RequireAuth>
              <ShopLayout>
                <Routes>
                  {isStaff ? (
                    <>
                      <Route path="pos" element={<PosPage />} />
                      <Route path="sales" element={<SalesPage />} />
                      <Route path="shifts" element={<ShiftsPage />} />
                      <Route index element={<Navigate to="pos" replace />} />
                      <Route path="*" element={<Navigate to="/pos" replace />} />
                    </>
                  ) : (
                    <>
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="customers" element={<CustomerListPage />} />
                      <Route path="customers/:id" element={<CustomerDetailPage />} />
                      <Route path="purchases" element={<PurchaseListPage />} />
                      <Route path="purchases/new" element={<NewPurchasePage />} />
                      <Route path="gift-cards" element={<GiftCardListPage />} />
                      <Route path="gift-cards/scan" element={<ScanGiftCardPage />} />
                      <Route path="rewards" element={<RewardsPage />} />
                      <Route path="redeem" element={<RedeemPage />} />
                      <Route path="messages" element={<MessageLogPage />} />
                      <Route path="users" element={<UserListPage />} />
                      <Route path="products" element={<ProductListPage />} />
                      <Route path="inventory" element={<InventoryPage />} />
                      <Route path="operations" element={<OperationsPage />} />
                      <Route path="pos" element={<PosPage />} />
                      <Route path="products/categories" element={<ProductCategoriesPage />} />
                      <Route path="sales" element={<SalesPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                      <Route path="shifts" element={<ShiftsPage />} />
                      <Route path="promotions" element={<PromotionsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route index element={<Navigate to="dashboard" replace />} />
                    </>
                  )}
                </Routes>
              </ShopLayout>
            </RequireAuth>
          }
        />

        {/* Admin portal — protected */}
        <Route
          path="/admin/*"
          element={
            <RequireAdminAuth>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="shops" element={<ShopsPage />} />
                  <Route path="plans" element={<PlansPage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AdminLayout>
            </RequireAdminAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
