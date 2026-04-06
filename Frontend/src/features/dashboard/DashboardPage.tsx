import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { reportsApi } from '../../api/reports';
import type { DashboardSummary } from '../../types';
import './dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await reportsApi.getSummary();
        setStats(res);
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="db-container">
        <div className="db-welcome">
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="db-grid" style={{ marginTop: '2rem' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="db-stat-card skeleton h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="db-container">
      {error && (
        <div className="sl-error" style={{ marginBottom: '1.5rem' }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7.5 4.5v3.5M7.5 10v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}
      {/* Header */}
      <header className="db-header">
        <div className="db-welcome">
          <h1>Welcome, {user?.name}</h1>
          <p>Here's what's happening in your shop today</p>
        </div>
        <div className="db-actions">
          <Link to="/purchases/new" className="shop-btn shop-btn--primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Record Purchase</span>
          </Link>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="db-grid">
        <div className="db-stat-card">
          <div className="db-stat-icon db-stat-icon--maroon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="db-stat-info">
            <span className="db-stat-label">Total Customers</span>
            <span className="db-stat-value">{stats?.totalCustomers ?? 0}</span>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-icon db-stat-icon--green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="db-stat-info">
            <span className="db-stat-label">Total Revenue</span>
            <span className="db-stat-value">${Number(stats?.totalRevenue ?? 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-icon db-stat-icon--blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div className="db-stat-info">
            <span className="db-stat-label">Points Issued</span>
            <span className="db-stat-value">{(Number(stats?.totalRevenue ?? 0) * 100).toLocaleString()}</span>
          </div>
        </div>

        <div className="db-stat-card">
          <div className="db-stat-icon db-stat-icon--amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="db-stat-info">
            <span className="db-stat-label">Points Redeemed</span>
            <span className="db-stat-value">{stats?.totalRedemptions ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Charts & Secondary Grid */}
      <div className="db-layout">
        {/* Recent Purchases Placeholder */}
        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title">Recent Customer Activity</h2>
            <Link to="/purchases" className="db-card-link">View All</Link>
          </div>
          {stats?.totalPurchases === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              No recent activity found. Start recording purchases to see them here!
            </div>
          ) : (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Points</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Normally we'd fetch actual list but using summary count logic for now */}
                <tr>
                  <td>Sample Customer</td>
                  <td>120</td>
                  <td>$45.00</td>
                  <td><span className="shop-badge shop-badge--green">Completed</span></td>
                </tr>
                <tr>
                  <td>Another Person</td>
                  <td>300</td>
                  <td>$120.00</td>
                  <td><span className="shop-badge shop-badge--green">Completed</span></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Quick Tools */}
        <div className="db-card">
          <div className="db-card-header">
            <h2 className="db-card-title">Quick Actions</h2>
          </div>
          <div className="db-quick-actions">
            <Link to="/customers" className="db-action-btn">
              <div className="db-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
              New Customer
            </Link>
            <Link to="/redeem" className="db-action-btn">
              <div className="db-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"></polyline>
                  <rect x="2" y="7" width="20" height="5"></rect>
                  <line x1="12" y1="22" x2="12" y2="7"></line>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                </svg>
              </div>
              Redeem Rewards
            </Link>
            <Link to="/reports" className="db-action-btn">
              <div className="db-action-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                  <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                </svg>
              </div>
              Market Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
