import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  label: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Customers', path: '/customers' },
  { label: 'New Purchase', path: '/purchases/new' },
  { label: 'Redeem', path: '/redeem' },
  { label: 'Gift Cards', path: '/gift-cards' },
  { label: 'Rewards', path: '/rewards' },
  { label: 'Messages', path: '/messages' },
  { label: 'Users', path: '/users' },
  { label: 'Settings', path: '/settings' },
];

interface ShopLayoutProps {
  children: ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  const { user, clearAuth } = useAuth();

  return (
    <div className="shop-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <span className="logo">Loyalty</span>
        </div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <a href={item.path}>{item.label}</a>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <span>{user?.name}</span>
          <button onClick={clearAuth}>Logout</button>
        </div>
      </nav>
      <main className="main-content">{children}</main>
    </div>
  );
}
