import type { ReactNode } from 'react';
import { useAdminAuth } from '../../hooks/useAuth';

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Shops', path: '/admin/shops' },
  { label: 'Plans', path: '/admin/plans' },
  { label: 'Billing', path: '/admin/billing' },
];

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { admin, clearAdminAuth } = useAdminAuth();

  return (
    <div className="admin-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <span className="logo">Admin</span>
        </div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <a href={item.path}>{item.label}</a>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <span>{admin?.name}</span>
          <button onClick={clearAdminAuth}>Logout</button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
