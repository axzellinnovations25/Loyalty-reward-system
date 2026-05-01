import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import { purchasesApi } from '../../api/purchases';
import { redemptionsApi } from '../../api/redemptions';
import { settingsApi } from '../../api/settings';
import type { Customer, ShopSettings, Purchase, RedemptionPreview, Redemption } from '../../types';
import './purchases.css';

export default function NewPurchasePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [, setRecentRedemptions] = useState<Redemption[]>([]);
  // Redemption offer state
  const [redemptionPreview, setRedemptionPreview] = useState<RedemptionPreview | null>(null);
  const [applyRedemption, setApplyRedemption] = useState(false);
  const [redemptionPoints, setRedemptionPoints] = useState(0);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  // Void purchase state
  const [voidTarget, setVoidTarget] = useState<Purchase | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);


  const fetchRecentPurchases = async () => {
    try {
      const res = await purchasesApi.list({ limit: 5 });
      const payload = (res as any).data ?? res;
      const items = payload.items ?? (Array.isArray(payload) ? payload : []);
      setRecentPurchases(items);
    } catch (err) {
      console.error('Failed to fetch recent purchases', err);
    }
  };

  const fetchRecentRedemptions = async () => {
    try {
      const res = await redemptionsApi.list({ limit: 5 });
      const payload = (res as any).data ?? res;
      const items = payload.items ?? (Array.isArray(payload) ? payload : []);
      setRecentRedemptions(items);
    } catch (err) {
      console.error('Failed to fetch recent redemptions', err);
    }
  };

  useEffect(() => {
    settingsApi.get().then(res => {
      // Handle either standard { data } or raw object
      setSettings(((res as { data?: ShopSettings }).data ?? res) as ShopSettings);
    }).catch(console.error);
    fetchRecentPurchases();
    fetchRecentRedemptions();
  }, []);

  // Debounced live search suggestions as user types
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await customersApi.list({ search: searchQuery, limit: 8 });
        const payload = (res as any).data ?? res;
        const items = payload.items ?? (Array.isArray(payload) ? payload : []);
        setSearchResults(items);
        setShowSuggestions(items.length > 0);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectCustomer = (c: Customer) => {
    setCustomer(c);
    setSearchQuery(c.name);
    setSearchResults([]);
    setShowSuggestions(false);
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    // If suggestions already showing and there's exactly one, pick it
    if (searchResults.length === 1) { selectCustomer(searchResults[0]); return; }
    setLoading(true);
    setError(null);
    setCustomer(null);
    setSearchResults([]);
    setShowSuggestions(false);
    setSuccess(false);
    try {
      const res = await customersApi.list({ search: searchQuery, limit: 10 });
      const payload = (res as any).data ?? res;
      const items = payload.items ?? (Array.isArray(payload) ? payload : []);
      if (items.length === 1) {
        selectCustomer(items[0]);
      } else if (items.length > 1) {
        setSearchResults(items);
        setShowSuggestions(true);
      } else {
        setError('Customer not found. Please check the name or phone number.');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error searching for customer.');
    } finally {
      setLoading(false);
    }
  };

  const pointsPerUnit = settings?.pointsPerAmount ? Number(settings.pointsPerAmount) : 100;
  const billAmount = Number(amount) || 0;
  const pointsToEarn = Math.floor(billAmount / pointsPerUnit);

  // Compute live discount value from the adjustable redemptionPoints
  const computeDiscount = (pts: number) => {
    if (pts < 1) return 0;
    // Use settings embedded in the preview response for accuracy
    const mode = redemptionPreview?.maxRedeemMode ?? settings?.maxRedeemMode;
    const rate = redemptionPreview?.redemptionValue ?? (settings?.redemptionValue ? Number(settings.redemptionValue) : 500);
    if (mode === 'flat_amount') return pts / rate;
    if (mode === 'percent_of_bill') return (rate / 100) * billAmount;
    return 0;
  };
  const liveDiscount = computeDiscount(redemptionPoints);

  // Auto-fetch redemption preview whenever amount or customer changes
  const fetchRedemptionPreview = useCallback(async (cust: Customer) => {
    const minPts = settings?.minRedeemPoints ?? 0;
    const qualifyingMin = minPts > 0 ? minPts : 1;
    if (!cust || cust.totalPoints < qualifyingMin) {
      setRedemptionPreview(null);
      setApplyRedemption(false);
      return;
    }
    setRedemptionLoading(true);
    try {
      const res = await redemptionsApi.preview(cust.id, cust.totalPoints);
      const data = ((res as any).data ?? res) as RedemptionPreview;
      setRedemptionPreview(data);
      // Default redeem amount = minimum required (not ALL points)
      setRedemptionPoints(minPts > 0 ? minPts : 1);
    } catch { setRedemptionPreview(null); }
    finally { setRedemptionLoading(false); }
  }, [settings]);

  useEffect(() => {
    if (customer && billAmount > 0) fetchRedemptionPreview(customer);
    else { setRedemptionPreview(null); setApplyRedemption(false); setRedemptionPoints(0); }
  }, [customer, billAmount, fetchRedemptionPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !amount) return;
    setLoading(true);
    setError(null);
    try {
      await purchasesApi.create({ customerId: customer.id, amount: Number(amount) });
      if (applyRedemption && redemptionPoints > 0) {
        await redemptionsApi.create({ customerId: customer.id, pointsRedeemed: redemptionPoints, billAmount: Number(amount) });
      }
      // Re-fetch customer BEFORE setSuccess so receipt shows correct balance
      try {
        const freshRes = await customersApi.get(customer.id);
        const fresh = ((freshRes as { data?: Customer }).data ?? freshRes) as Customer;
        if (fresh?.id) setCustomer(fresh);
      } catch { /* keep stale on failure */ }
      fetchRecentPurchases();
      fetchRecentRedemptions();
      setSuccess(true); // Set AFTER re-fetch so receipt balance is accurate
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to record purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="np-page">
      <div className="np-sections">

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Record Purchase</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.95rem' }}>Search a customer and record their bill to award loyalty points.</p>
        </div>

        {error && (
          <div className="np-error" style={{ marginBottom: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        {success && customer ? (
          <div className="np-fade" style={{ maxWidth: 480, margin: '0 auto', padding: '40px 0' }}>
            {/* Success icon */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 12px 28px rgba(16,185,129,0.3)', animation: 'np-fade .5s ease' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Purchase Recorded!</h2>
              <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.95rem' }}>
                {applyRedemption ? 'Discount applied and SMS sent to customer.' : 'Loyalty points successfully added to account.'}
              </p>
            </div>

            {/* Receipt */}
            <div style={{ background: '#fff', borderRadius: 20, border: '1px dashed #cbd5e1', padding: '28px 32px', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: 28 }}>
              {/* Receipt notches */}
              <div style={{ position: 'absolute', left: -13, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', background: '#f0f4f8', border: '1px dashed #cbd5e1' }} />
              <div style={{ position: 'absolute', right: -13, top: '50%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', background: '#f0f4f8', border: '1px dashed #cbd5e1' }} />

              {/* Customer */}
              <div style={{ textAlign: 'center', paddingBottom: 20, marginBottom: 20, borderBottom: '1px dashed #e2e8f0' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(168,0,40,0.1)', color: '#a80028', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, margin: '0 auto 10px' }}>
                  {customer.name[0].toUpperCase()}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>{customer.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 2 }}>{customer.phone}</div>
              </div>

              {/* Line items */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px 24px', marginBottom: 20 }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Original Bill</div>
                <div style={{ color: '#1e293b', fontWeight: 600 }}>Rs {Number(amount).toFixed(2)}</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Points Earned</div>
                <div style={{ color: '#059669', fontWeight: 800 }}>+{pointsToEarn} PTS</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>New Balance</div>
                <div style={{ fontWeight: 800, color: '#a80028' }}>{(customer?.totalPoints || 0) - redemptionPoints + pointsToEarn} PTS</div>
              </div>

              {/* Discount Panel */}
              {applyRedemption && liveDiscount > 0 && (
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span>Points Used</span>
                    <span style={{ color: '#a80028' }}>-{redemptionPoints} PTS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span>Discount Applied</span>
                    <span style={{ color: '#059669' }}>- Rs {liveDiscount.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #cbd5e1', paddingTop: 16, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a' }}>
                    <span>Final Amount to Pay</span>
                    <span>Rs {(billAmount - liveDiscount).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="np-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => { setCustomer(null); setAmount(''); setSearchQuery(''); setSearchResults([]); setRedemptionPreview(null); setApplyRedemption(false); setRedemptionPoints(0); setSuccess(false); }}
              >
                New Transaction
              </button>
              <button className="np-btn-maroon" style={{ flex: 1 }} onClick={() => navigate('/customers')}>
                View Customers
              </button>
            </div>
          </div>
        ) : (
          <div className="np-wizard-wrapper np-fade">
            <div className="np-wizard-steps">
              <div className={`np-wizard-step ${!customer ? 'active' : 'completed'}`}>
                <div className="np-step-circle">{!customer ? '1' : '✓'}</div>
                <div className="np-step-text">Find Customer</div>
              </div>
              <div className="np-wizard-line">
                <div style={{ width: customer ? '100%' : '0%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </div>
              <div className={`np-wizard-step ${customer ? 'active' : 'pending'}`}>
                <div className="np-step-circle">2</div>
                <div className="np-step-text">Record Bill</div>
              </div>
            </div>

            <div className="np-wizard-content" style={{ position: 'relative' }}>
              {!customer ? (
                <div className="np-fade" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '20px 0 40px' }}>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginBottom: 10 }}>Who is purchasing?</h3>
                  <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: 30 }}>Search by name or phone number to load their loyalty profile.</p>

                  <form onSubmit={handleSearch} style={{ position: 'relative', textAlign: 'left' }}>
                    <div className="np-glass-search-wrap">
                      <div className="np-search-icon-glass">
                        {searchLoading
                          ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a80028" strokeWidth="2.5" style={{ animation: 'np-spin .7s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        }
                      </div>
                      <input
                        id="customer-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setError(null); }}
                        onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                        placeholder="Type name or phone number..."
                        className="np-glass-search"
                        autoComplete="off"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={loading || !searchQuery}
                        className="np-search-btn-inside"
                      >
                        Search
                      </button>

                      {showSuggestions && searchResults.length > 0 && (
                        <div className="np-dropdown">
                          {searchResults.map((result, idx) => (
                            <div
                              key={result.id}
                              className="np-dropdown-item"
                              onMouseDown={() => selectCustomer(result)}
                              style={{ borderBottom: idx < searchResults.length - 1 ? '1px solid #f8fafc' : 'none' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(168,0,40,0.1)', color: '#a80028', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, flexShrink: 0 }}>
                                  {result.name[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="np-dropdown-name">{result.name}</div>
                                  <div className="np-dropdown-phone">{result.phone}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span className="np-pts-chip">{result.totalPoints.toLocaleString()} pts</span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a80028" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </form>

                  {!showSuggestions && searchResults.length > 1 && (
                    <div style={{ marginTop: 30, textAlign: 'left' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        Multiple matches found
                      </div>
                      <div className="np-match-list">
                        {searchResults.map(result => (
                          <div key={result.id} className="np-match-item" onClick={() => selectCustomer(result)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(168,0,40,0.1)', color: '#a80028', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, flexShrink: 0 }}>
                                {result.name[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{result.name}</div>
                                <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 1 }}>{result.phone}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className="np-pts-chip">{result.totalPoints.toLocaleString()} pts</span>
                              <span style={{ color: '#a80028', fontWeight: 700, fontSize: '0.8rem' }}>Select &rarr;</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="np-fade" style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 20 }}>
                  <div className="np-premium-loyalty">
                    <div className="np-loyalty-left">
                      <div className="np-loyalty-badge">Loyalty Member</div>
                      <div className="np-loyalty-name">{customer.name}</div>
                      <div className="np-loyalty-phone">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        {customer.phone}
                      </div>
                    </div>
                    <div className="np-loyalty-right">
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>Current Balance</div>
                      <div className="np-loyalty-pts">{customer.totalPoints.toLocaleString()}</div>
                      <div className="np-loyalty-pts-sub">PTS Available</div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div style={{ textAlign: 'center', marginBottom: 30 }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
                        Enter Bill Amount
                      </label>
                      <div className="np-premium-amount-wrap">
                        <div className="np-premium-amount-prefix">Rs</div>
                        <input
                          id="bill-amount-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          className="np-premium-amount"
                          autoFocus
                        />
                      </div>
                    </div>

                    {billAmount > 0 && (
                      <div className="np-pts-preview np-fade" style={{ marginBottom: 24 }}>
                        <div className="np-pts-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        </div>
                        <div>
                          <div className="np-pts-earn-label">Earning this visit</div>
                          <div className="np-pts-earn-value">+{pointsToEarn} <span style={{ fontSize: '1rem', fontWeight: 700 }}>PTS</span></div>
                          <div className="np-pts-earn-sub">New balance: {(customer.totalPoints + pointsToEarn).toLocaleString()} PTS</div>
                        </div>
                      </div>
                    )}

                    {billAmount > 0 && redemptionLoading && (
                      <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', marginBottom: 24 }}>
                        Checking redemption offers...
                      </div>
                    )}
                    {billAmount > 0 && !redemptionLoading && redemptionPreview && (
                      <div className={`np-redeem-box${applyRedemption ? ' np-redeem-box--active' : ''} np-fade`} style={{ marginBottom: 30 }}>
                        <div className={`np-redeem-header${applyRedemption ? ' np-redeem-header--active' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.2rem' }}>🎁</span>
                            <div>
                              <div className={`np-redeem-title${applyRedemption ? ' np-redeem-title--active' : ''}`}>Redemption Available!</div>
                              <div className={`np-redeem-sub${applyRedemption ? ' np-redeem-sub--active' : ''}`}>Customer has redeemable points</div>
                            </div>
                          </div>
                          <button type="button" className={`np-redeem-toggle${applyRedemption ? ' np-redeem-toggle--active' : ''}`} onClick={() => setApplyRedemption(v => !v)}>
                            {applyRedemption ? 'Remove' : 'Apply'}
                          </button>
                        </div>
                        <div className="np-redeem-body">
                          <div className="np-redeem-row">
                            <span className="np-redeem-row-label">Points to Redeem</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="number" className="np-redeem-pts-input"
                                min={settings?.minRedeemPoints ?? 1} max={customer.totalPoints}
                                value={redemptionPoints}
                                disabled={settings?.maxRedeemMode === 'percent_of_bill'}
                                onChange={e => setRedemptionPoints(Math.min(Number(e.target.value), customer.totalPoints))}
                              />
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>/ {customer.totalPoints}</span>
                            </div>
                          </div>
                          <div className="np-redeem-row" style={{ paddingTop: 10, borderTop: '1px dashed #e2e8f0' }}>
                            <span className="np-redeem-row-label">Discount Value</span>
                            <span className="np-redeem-discount">Rs. {liveDiscount.toFixed(2)}</span>
                          </div>
                          {applyRedemption && (
                            <div className="np-redeem-confirm">✓ Discount will be applied & SMS sent</div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 16 }}>
                      <button
                        type="button"
                        onClick={() => { setCustomer(null); setAmount(''); setSearchQuery(''); setRedemptionPreview(null); setApplyRedemption(false); setRedemptionPoints(0); setError(null); }}
                        className="np-btn-secondary"
                        style={{ padding: '20px', fontSize: '1.15rem', flex: 1 }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        id="confirm-purchase-btn"
                        type="submit"
                        disabled={loading || !amount || billAmount <= 0 || success}
                        className="np-btn-primary"
                        style={{ padding: '20px', fontSize: '1.15rem', flex: 2 }}
                      >
                        {loading
                          ? <><span className="np-spinner" style={{ marginRight: 8 }} />Processing...</>
                          : <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8, verticalAlign: 'middle' }}><polyline points="20 6 9 17 4 12" /></svg> Confirm Purchase</>
                        }
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Combined Transactions Table */}
        <div className="np-card np-fade">
          <div className="np-card-header">
            <h2 className="np-card-title">Recent Transactions</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: '0.82rem', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Latest 5 entries
            </div>
          </div>

          <div className="np-table-wrap">
            <table className="np-table">
              <thead>
                <tr>
                  {['Date & Time', 'Customer', 'Bill Amount', 'Points Earned', 'Redeemed', 'Discount', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px 24px', color: '#64748b', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPurchases.length > 0 ? recentPurchases.map(p => (
                  <tr key={p.id} style={{ opacity: p.isVoided ? 0.5 : 1, borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }}>{new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem' }}>{p.customer?.name || '-'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 2 }}>{p.customer?.phone || '-'}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '0.95rem', textDecoration: p.isVoided ? 'line-through' : 'none' }}>
                        Rs {Number(p.amount).toFixed(2)}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {p.isVoided
                        ? <span className="np-badge-void">VOIDED</span>
                        : <span className="np-badge-pts">+{p.pointsEarned} PTS</span>
                      }
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {p.pointsRedeemed > 0
                        ? <span className="np-badge-redeemed">-{p.pointsRedeemed} PTS</span>
                        : <span style={{ color: '#cbd5e1', fontWeight: 600 }}>-</span>
                      }
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {p.pointsRedeemed > 0
                        ? <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem' }}>Rs {Number(p.discountValue ?? 0).toFixed(2)}</span>
                        : <span style={{ color: '#cbd5e1', fontWeight: 600 }}>-</span>
                      }
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {p.isVoided
                        ? <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>-</span>
                        : <button onClick={() => { setVoidTarget(p); setVoidError(null); }} className="void-btn" title="Void this transaction">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          Void
                        </button>
                      }
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                      <div style={{ width: 48, height: 48, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#94a3b8' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                      </div>
                      <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>No transactions yet</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Recent purchases will appear here after recording</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Void Purchase Confirmation Modal */}
        {voidTarget && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="animate-fade-in" style={{ background: '#fff', borderRadius: '20px', padding: '40px', maxWidth: '460px', width: '100%', boxShadow: '0 25px 60px -10px rgba(0,0,0,0.25)' }}>
              <div style={{ width: '64px', height: '64px', background: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#e11d48' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Void Transaction?</h3>
              <p style={{ margin: '0 0 24px', color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
                This will permanently void the purchase of <strong style={{ color: '#1e293b' }}>Rs {Number(voidTarget.amount).toFixed(2)}</strong> for <strong style={{ color: '#1e293b' }}>{voidTarget.customer?.name}</strong>.
              </p>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                <div style={{ fontSize: '0.88rem', color: '#9a3412', fontWeight: 600, lineHeight: 1.5 }}>
                  <strong>{voidTarget.pointsEarned} loyalty points</strong> will be reversed from the customer's balance. Any linked redemption will also be voided. This cannot be undone.
                </div>
              </div>
              {voidError && (
                <div style={{ padding: '12px 16px', background: '#fff1f2', borderLeft: '4px solid #e11d48', borderRadius: '8px', color: '#be123c', fontSize: '0.88rem', fontWeight: 600, marginBottom: '20px' }}>{voidError}</div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setVoidTarget(null); setVoidError(null); }} disabled={voidLoading} style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={async () => {
                    if (!voidTarget) return;
                    setVoidLoading(true); setVoidError(null);
                    try {
                      await purchasesApi.void(voidTarget.id);
                      setVoidTarget(null);
                      fetchRecentPurchases();
                      fetchRecentRedemptions();
                    } catch (err: unknown) {
                      const e = err as Error;
                      setVoidError(e.message || 'Failed to void transaction.');
                    } finally { setVoidLoading(false); }
                  }}
                  disabled={voidLoading}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: voidLoading ? 'not-allowed' : 'pointer', opacity: voidLoading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(220,38,38,0.3)' }}
                >{voidLoading ? 'Voiding...' : 'Yes, Void It'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}