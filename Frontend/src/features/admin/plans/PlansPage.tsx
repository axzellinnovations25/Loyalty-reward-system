// Real type placeholder for later integration
interface Plan {
  id: string;
  name: string;
  price: string;
  badge: string;
  featured: boolean;
  features: string[];
  limits: { customers: number; users: number; giftCards: number };
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M4 6.5l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function PlansPage() {
  const plans: Plan[] = [];

  return (
    <>
      <header className="adm-topbar">
        <span className="adm-topbar-title">Plans</span>
      </header>

      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <h1 className="adm-page-title">Subscription Plans</h1>
            <p className="adm-page-subtitle">Manage plan tiers, features, and limits for all shops.</p>
          </div>
          <button className="adm-btn adm-btn--primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Create Plan
          </button>
        </div>

        {/* Plan cards */}
        {plans.length === 0 ? (
          <div className="adm-empty" style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
            <div className="adm-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 10h10M7 6h6M7 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="adm-empty-title">No plans configured</div>
            <div className="adm-empty-desc">Create subscription plans to assign to shops.</div>
          </div>
        ) : (
          <div className="adm-plan-grid">
            {plans.map((plan) => (
              <div key={plan.id} className={`adm-plan-card${plan.featured ? ' adm-plan-card--featured' : ''}`}>
                {/* Name + badge */}
                <div className="adm-plan-name">
                  {plan.name}
                  {plan.featured && (
                    <span className="adm-badge adm-badge--maroon" style={{ fontSize: '0.68rem' }}>Popular</span>
                  )}
                </div>

                {/* Price */}
                <div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {plan.price}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>per month per shop</div>
                </div>

                <div className="adm-divider" style={{ margin: '4px 0' }} />

                {/* Features */}
                <ul className="adm-plan-feature-list">
                  {plan.features.map((f) => (
                    <li key={f}><CheckIcon />{f}</li>
                  ))}
                </ul>

                <div className="adm-divider" style={{ margin: '4px 0' }} />

                {/* Limits summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    { label: 'Customers', val: plan.limits.customers },
                    { label: 'Staff users', val: plan.limits.users },
                    { label: 'Gift cards/mo', val: plan.limits.giftCards },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: val === -1 ? 'var(--success)' : 'var(--text-primary)' }}>
                        {val === -1 ? 'Unlimited' : val.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <button className={`adm-btn ${plan.featured ? 'adm-btn--primary' : 'adm-btn--ghost'}`} style={{ width: '100%', justifyContent: 'center' }}>
                  Edit Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
