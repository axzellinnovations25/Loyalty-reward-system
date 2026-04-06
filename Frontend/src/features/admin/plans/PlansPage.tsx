import React, { useState, useEffect, useMemo } from 'react';
import { adminPlansApi } from '../../../api/admin/plans';
import type { Plan } from '../../../types';

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
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 18, height: 18, borderRadius: '50%',
      background: active ? 'var(--success-bg, #ecfdf5)' : 'transparent',
      color: active ? 'var(--success, #10b981)' : 'var(--text-muted, #9ca3af)',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.2 }}>
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
        const list = (res as unknown as { data: Plan[] }).data ?? (res as unknown as Plan[]);
        // Sort plans in order: basic, standard, pro, enterprise
        const order: string[] = ['basic', 'standard', 'pro', 'enterprise'];
        const sorted = [...list].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
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
    <div style={{ background: 'var(--n-50)', minHeight: '100vh' }}>
      <header className="adm-topbar" style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)' }}>
        <span className="adm-topbar-title">Program Infrastructure</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            background: 'var(--n-100)', padding: '4px', borderRadius: 'var(--r-md)', display: 'flex', gap: 2, border: '1px solid var(--border)'
          }}>
            {(['monthly', 'annual'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                style={{
                  padding: '6px 16px', fontSize: '0.72rem', fontWeight: 700, border: 'none', borderRadius: '6px', cursor: 'pointer',
                  background: billingCycle === cycle ? 'var(--white)' : 'transparent',
                  color: billingCycle === cycle ? 'var(--a-800)' : 'var(--text-secondary)',
                  boxShadow: billingCycle === cycle ? 'var(--shadow-sm)' : 'none',
                  transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {cycle.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="adm-page" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        {/* Intro */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--a-50)', color: 'var(--a-700)',
            padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 20
          }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
            Entitlement Management
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.05em', marginBottom: 16 }}>
            Subscription <span style={{ color: 'var(--a-600)' }}>Governance</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Architect your shop tiers with precision. Control feature availability and hardware-level limits from a centralized platform.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 20 }}>
            <span className="adm-spinner adm-spinner--dark" style={{ width: 40, height: 40 }} />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>Fetching System Tiers...</div>
          </div>
        ) : error ? (
          <div className="adm-empty" style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: 'var(--r-xl)', padding: 60 }}>
            <div style={{ fontSize: '3rem', marginBottom: 20 }}>⚠️</div>
            <div className="adm-empty-title" style={{ color: '#991b1b' }}>Infrastructure Sync Failed</div>
            <div className="adm-empty-desc" style={{ maxWidth: 400, margin: '12px auto' }}>{error}</div>
          </div>
        ) : (
          <>
            {/* Plan Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: 32, 
              marginBottom: 100 
            }}>
              {plans.map((plan) => {
                const toggles = plan.features.filter(f => f.featureKey && f.enabled).map(f => f.featureKey);
                const limits  = plan.features.filter(f => f.limitKey);
                const isPro   = plan.id === 'pro';
                const isEnt   = plan.id === 'enterprise';

                return (
                  <div key={plan.id} style={{
                    background: 'var(--white)', border: isPro ? '2px solid var(--a-600)' : '1px solid var(--border)',
                    borderRadius: '24px', padding: 40, display: 'flex', flexDirection: 'column', position: 'relative',
                    boxShadow: isPro ? '0 32px 64px -16px rgba(128, 0, 32, 0.12)' : '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)',
                    transition: '0.3s transform'
                  }}>
                    {isPro && (
                      <div style={{
                        position: 'absolute', top: 20, right: 20, background: 'var(--a-600)', color: '#fff',
                        padding: '4px 12px', borderRadius: '100px', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase'
                      }}>
                        Most Scalable
                      </div>
                    )}

                    <div style={{ marginBottom: 40 }}>
                      <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>
                        {plan.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.05em' }}>
                          {PLAN_PRICES[plan.id]?.[billingCycle]}
                        </span>
                        {!isEnt && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/mo</span>}
                      </div>
                    </div>

                    <div style={{ background: 'var(--n-50)', borderRadius: '16px', padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {limits.map(l => (
                        <div key={l.limitKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ color: 'var(--a-600)', display: 'flex' }}>{LIMIT_LABELS[l.limitKey!]?.icon}</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{LIMIT_LABELS[l.limitKey!]?.label}</span>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {l.limitValue === -1 ? '∞' : l.limitValue?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
                        Capabilities
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {allFeatureKeys.map(key => {
                          const has = toggles.includes(key);
                          if (!has && plan.id === 'basic') return null;
                          return (
                            <li key={key} style={{ 
                              display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', 
                              color: has ? 'var(--text-primary)' : 'var(--text-muted)',
                              opacity: has ? 1 : 0.4
                            }}>
                              <CheckIcon active={has} />
                              <span style={{ fontWeight: has ? 500 : 400 }}>{FEATURE_LABELS[key]}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <button disabled style={{
                      width: '100%', marginTop: 40, padding: '14px', borderRadius: '12px', border: 'none',
                      background: isPro ? 'var(--a-600)' : 'var(--n-100)',
                      color: isPro ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.85rem', fontWeight: 700, cursor: 'not-allowed',
                      boxShadow: isPro ? '0 10px 15px -3px rgba(128, 0, 32, 0.2)' : 'none'
                    }}>
                      Infrastructure Locked
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Matrix Section */}
            <div style={{ 
              background: 'var(--white)', borderRadius: '32px', padding: '60px', 
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.03), 0 10px 10px -5px rgba(0,0,0,0.02)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.04em', marginBottom: 12 }}>
                  Entitlement Decision Matrix
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>A technical breakdown of cross-tier capabilities and synchronization rules.</p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '24px', background: 'var(--n-50)', borderRadius: '16px 0 0 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Feature Set</th>
                      {plans.map((p, idx) => (
                        <th key={p.id} style={{ 
                          padding: '24px', background: 'var(--n-50)', 
                          borderRadius: idx === plans.length - 1 ? '0 16px 16px 0' : '0',
                          fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 800 
                        }}>
                          {p.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatureKeys.map(key => (
                      <tr key={key} style={{ borderBottom: '1px solid var(--n-50)' }}>
                        <td style={{ padding: '24px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {FEATURE_LABELS[key]}
                        </td>
                        {plans.map(p => {
                          const has = p.features.some(f => f.featureKey === key && f.enabled);
                          return (
                            <td key={p.id} style={{ textAlign: 'center', padding: '24px' }}>
                              <div style={{ display: 'inline-flex' }}><CheckIcon active={has} /></div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ height: 100 }} />
          </>
        )}
      </div>
    </div>
  );
}
