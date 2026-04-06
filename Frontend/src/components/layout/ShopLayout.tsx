import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ChangePasswordModal from '../../features/auth/ChangePasswordModal';
import './shop-layout.css';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { 
    label: 'Dashboard', 
    path: '/dashboard', 
    group: 'Main',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    )
  },
  { 
    label: 'Customers', 
    path: '/customers', 
    group: 'Main',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    )
  },
  { 
    label: 'Record Purchase', 
    path: '/purchases/new', 
    group: 'Transactions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    )
  },
  { 
    label: 'Redeem Rewards', 
    path: '/redeem', 
    group: 'Transactions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"></polyline>
        <rect x="2" y="7" width="20" height="5"></rect>
        <line x1="12" y1="22" x2="12" y2="7"></line>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
      </svg>
    )
  },
  { 
    label: 'Gift Cards', 
    path: '/gift-cards', 
    group: 'Transactions',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
      </svg>
    )
  },
  { 
    label: 'Reward Tiers', 
    path: '/rewards', 
    group: 'Configuration',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7"></circle>
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
      </svg>
    )
  },
  { 
    label: 'Messages', 
    path: '/messages', 
    group: 'Communication',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    )
  },
  { 
    label: 'Staff Users', 
    path: '/users', 
    group: 'Configuration',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <line x1="19" y1="8" x2="19" y2="14"></line>
        <line x1="22" y1="11" x2="16" y2="11"></line>
      </svg>
    )
  },
  { 
    label: 'Settings', 
    path: '/settings', 
    group: 'Configuration',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    )
  },
];

interface ShopLayoutProps {
  children: ReactNode;
}

export default function ShopLayout({ children }: ShopLayoutProps) {
  const { user, clearAuth } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Group items
  const mainItems = NAV_ITEMS.filter((i) => i.group === 'Main');
  const txItems = NAV_ITEMS.filter((i) => i.group === 'Transactions');
  const commItems = NAV_ITEMS.filter((i) => i.group === 'Communication');
  const configItems = NAV_ITEMS.filter((i) => i.group === 'Configuration');

  return (
    <div className="shop-layout-root">
      {/* Sidebar */}
      <aside className="shop-sidebar">
        {/* Brand */}
        <div className="shop-sidebar-header">
          <NavLink to="/dashboard" className="shop-logo-wrap">
            <div className="shop-logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <span className="shop-logo-text">LoyaltyOS</span>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="shop-nav">
          <div className="shop-nav-label">Main</div>
          {mainItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          <div className="shop-nav-label">Transactions</div>
          {txItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
          
          <div className="shop-nav-label">Communication</div>
          {commItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}

          <div className="shop-nav-label">Configuration</div>
          {configItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `shop-nav-link ${isActive ? 'active' : ''}`}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer Profile */}
        <div className="shop-sidebar-footer">
          <div className="shop-user-profile">
            <div className="shop-user-avatar">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="shop-user-info">
              <div className="shop-user-name">{user?.name}</div>
              <div className="shop-user-role">
                {user?.role === 'owner' ? 'Shop Owner' : 'Staff'}
              </div>
            </div>
            <div className="shop-user-actions" style={{ display: 'flex', gap: '2px', marginLeft: 'auto' }}>
              <button 
                className="shop-logout-btn" 
                onClick={() => setIsChangePasswordOpen(true)} 
                title="Change Password"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </button>
              <button className="shop-logout-btn" onClick={clearAuth} title="Log out">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {isChangePasswordOpen && user && (
        <ChangePasswordModal 
          onClose={() => setIsChangePasswordOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <main className="shop-main">
        {/* We can leave topbar empty for now or put breadcrumbs/search here */}
        <div className="shop-page-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
