import React, { useState, useEffect, useMemo } from 'react';
import { adminPlansApi } from '../../../api/admin/plans';
import type { Plan } from '../../../types';
import './plans.css';

// ── Mapping & Icons ──────────────────────────────────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
  gift_cards:            'Gift Cards Interface',
  rewards_milestones:    'Rewards & Progress',
  audit_log:             'Security Audit Logs',
  sms_messaging:         'Direct SMS Messaging',
  promotions_broadcasts: 'Campaign Broadcasts',
  reports_exports:       'Business Intelligence',
  whatsapp_messaging:    'WhatsApp Integration',
  multiple_users:        'Enterprise User Access',
};

const LIMIT_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  max_customers: {
    label: 'Customers',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
  max_users: {
    label: 'Staff Slots',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  },
  max_gift_cards_pm: {
    label: 'Gift Tokens',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  },
  max_sms_pm: {
    label: 'Sms Quota',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  },
};

const PLAN_PRICES: Record<string, { monthly: string; annual: string }> = {
  basic:      { monthly: 'LKR 2,500',  annual: 'LKR 2,250' },
  standard:   { monthly: 'LKR 7,500',  annual: 'LKR 6,750' },
  pro:        { monthly: 'LKR 15,000', annual: 'LKR 13,500' },
  enterprise: { monthly: 'Custom',     annual: 'Custom' },
};

function CheckIcon({ active = true }: { active?: boolean }) {
  return (
    <div className={`plans-check-icon ${active ? 'plans-check-icon--active' : 'plans-check-icon--idle'}`}>
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        className={active ? 'plans-check-svg--active' : 'plans-check-svg--idle'}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await adminPlansApi.list();
        const raw = (res as unknown as { data: Plan[] }).data ?? (res as unknown as Plan[]);
        const order: string[] = ['basic', 'standard', 'pro', 'enterprise'];
        const sorted = [...raw]
          .filter(p => p.isActive)
          .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        setPlans(sorted);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load plans.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const allFeatureKeys = useMemo(() => Object.keys(FEATURE_LABELS), []);

  return (
    <div className="plans-root">
      <header className="adm-topbar plans-topbar">
        <span className="adm-topbar-title">Program Infrastructure</span>
        <div className="plans-topbar-right">
          <div className="plans-cycle-wrap">
            {(['monthly', 'annual'] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`plans-cycle-btn ${billingCycle === cycle ? 'plans-cycle-btn--active' : 'plans-cycle-btn--idle'}`}
              >
                {cycle.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="adm-page plans-page">
        {/* Intro */}
        <div className="plans-intro">
          <div className="plans-intro-pill">
            <span className="plans-intro-pill-dot" />
            Entitlement Management
          </div>
          <h1 className="plans-intro-h1">
            Subscription <span className="plans-intro-accent">Governance</span>
          </h1>
          <p className="plans-intro-p">
            Architect your shop tiers with precision. Control feature availability and hardware-level limits from a centralized platform.
          </p>
        </div>

        {loading ? (
          <div className="plans-loading">
            <span className="adm-spinner adm-spinner--dark plans-loading-spinner" />
            <div className="plans-loading-text">Fetching System Tiers...</div>
          </div>
        ) : error ? (
          <div className="adm-empty plans-error">
            <div className="plans-error-emoji">⚠️</div>
            <div className="adm-empty-title plans-error-title">Infrastructure Sync Failed</div>
            <div className="adm-empty-desc plans-error-desc">{error}</div>
          </div>
        ) : (
          <>
            {/* Plan Grid */}
            <div className="plans-grid">
              {plans.map((plan) => {
                const toggles = plan.features.filter(f => f.featureKey && f.enabled).map(f => f.featureKey);
                const limits  = plan.features.filter(f => f.limitKey);
                const isPro   = plan.id === 'pro';
                const isEnt   = plan.id === 'enterprise';

                return (
                  <div key={plan.id} className={`plans-card ${isPro ? 'plans-card--pro' : ''}`}>
                    {isPro && (
                      <div className="plans-pro-badge">Most Scalable</div>
                    )}

                    <div className="plans-card-header">
                      <h3 className="plans-card-name">{plan.name}</h3>
                      <div className="plans-price-row">
                        <span className="plans-price">
                          {PLAN_PRICES[plan.id]?.[billingCycle]}
                        </span>
                        {!isEnt && <span className="plans-price-period">/mo</span>}
                      </div>
                    </div>

                    <div className="plans-limits">
                      {limits.map(l => (
                        <div key={l.limitKey} className="plans-limit-row">
                          <div className="plans-limit-left">
                            <span className="plans-limit-icon">{LIMIT_LABELS[l.limitKey!]?.icon}</span>
                            <span className="plans-limit-label">{LIMIT_LABELS[l.limitKey!]?.label}</span>
                          </div>
                          <span className="plans-limit-value">
                            {l.limitValue === null ? '∞' : l.limitValue?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="plans-features">
                      <h4 className="plans-features-heading">Capabilities</h4>
                      <ul className="plans-feature-list">
                        {allFeatureKeys.map(key => {
                          const has = toggles.includes(key);
                          return (
                            <li key={key} className={`plans-feature-item ${has ? 'plans-feature-item--active' : 'plans-feature-item--idle'}`}>
                              <CheckIcon active={has} />
                              <span className={has ? 'plans-feature-name--active' : 'plans-feature-name--idle'}>
                                {FEATURE_LABELS[key]}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <button
                      disabled
                      type="button"
                      className={`plans-cta-btn ${isPro ? 'plans-cta-btn--pro' : 'plans-cta-btn--default'}`}
                    >
                      Infrastructure Locked
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Matrix Section */}
            <div className="plans-matrix">
              <div className="plans-matrix-header">
                <h2 className="plans-matrix-h2">Entitlement Decision Matrix</h2>
                <p className="plans-matrix-p">A technical breakdown of cross-tier capabilities and synchronization rules.</p>
              </div>

              <div className="plans-matrix-scroll">
                <table className="plans-matrix-table">
                  <thead>
                    <tr>
                      <th className="plans-matrix-th-feature">Feature Set</th>
                      {plans.map((p, idx) => (
                        <th
                          key={p.id}
                          className={`plans-matrix-th-plan ${idx === plans.length - 1 ? 'plans-matrix-th-plan--last' : ''}`}
                        >
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatureKeys.map(key => (
                      <tr key={key} className="plans-matrix-tr">
                        <td className="plans-matrix-td-feature">
                          {FEATURE_LABELS[key]}
                        </td>
                        {plans.map(p => {
                          const has = p.features.some(f => f.featureKey === key && f.enabled);
                          return (
                            <td key={p.id} className="plans-matrix-td-check">
                              <div className="plans-matrix-check-wrap"><CheckIcon active={has} /></div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="plans-spacer" />
          </>
        )}
      </div>
    </div>
  );
}
