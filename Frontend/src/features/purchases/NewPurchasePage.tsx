import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import { purchasesApi } from '../../api/purchases';
import { redemptionsApi } from '../../api/redemptions';
import { settingsApi } from '../../api/settings';
import type { Customer, ShopSettings, Purchase, Redemption, RedemptionPreview } from '../../types';

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
  // Redemption offer state
  const [redemptionPreview, setRedemptionPreview] = useState<RedemptionPreview | null>(null);
  const [applyRedemption, setApplyRedemption] = useState(false);
  const [redemptionPoints, setRedemptionPoints] = useState(0);
  const [redemptionLoading, setRedemptionLoading] = useState(false);
  // Void purchase state
  const [voidTarget, setVoidTarget] = useState<Purchase | null>(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  // Recent redemptions + void-redemption state
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  const [voidRedemptionTarget, setVoidRedemptionTarget] = useState<Redemption | null>(null);
  const [voidRedemptionLoading, setVoidRedemptionLoading] = useState(false);
  const [voidRedemptionError, setVoidRedemptionError] = useState<string | null>(null);

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
      // Re-fetch customer to get the actual updated totalPoints from DB
      try {
        const freshRes = await customersApi.get(customer.id);
        const fresh = ((freshRes as { data?: Customer }).data ?? freshRes) as Customer;
        if (fresh?.id) setCustomer(fresh);
      } catch { /* keep stale data if refresh fails — not critical */ }
      setSuccess(true);
      fetchRecentPurchases();
      fetchRecentRedemptions();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to record purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f4f7f9', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(168,0,40,0.1)', color: '#a80028', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '12px' }}>
              TRANSACTIONS
            </div>
            <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Record Purchase
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '1.1rem' }}>
              Award loyalty points to your customers instantly.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="premium-card animate-fade-in" style={{ padding: '40px' }}>
          {error && (
            <div style={{ padding: '16px 20px', background: '#fff1f2', borderLeft: '4px solid #e11d48', borderRadius: '8px', color: '#be123c', fontSize: '0.95rem', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 10px rgba(225, 29, 72, 0.1)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {success && customer ? (
            <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)', transform: 'scale(1)', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <h2 style={{ margin: '0 0 12px', fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>Purchase Recorded!</h2>
              <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>
                {applyRedemption ? 'Points earned, discount applied & SMS sent to customer.' : 'Points have been successfully added to the customer\'s account.'}
              </p>
              
              <div className="receipt-card" style={{ maxWidth: '400px', margin: '0 auto 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '8px' }}>Customer</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>{customer.name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>{customer.phone}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Bill Amount</span>
                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem' }}>Rs {Number(amount).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>Points Earned</span>
                  <span style={{ fontWeight: 800, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px' }}>+{pointsToEarn} PTS</span>
                </div>
                {applyRedemption && redemptionPoints > 0 && (
                  <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Points Redeemed</span>
                    <span style={{ fontWeight: 800, color: '#f59e0b', background: '#fffbeb', padding: '4px 10px', borderRadius: '8px' }}>-{redemptionPoints} PTS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Discount Applied</span>
                    <span style={{ fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px' }}>Rs. {liveDiscount.toFixed(2)} OFF</span>
                  </div>
                  </>
                )}
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>New Balance</span>
                  <span style={{ fontWeight: 900, color: '#a80028', fontSize: '1.4rem' }}>
                    {(customer.totalPoints + pointsToEarn - (applyRedemption ? redemptionPoints : 0)).toLocaleString()} PTS
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                    setCustomer(null);
                    setAmount('');
                    setSearchQuery('');
                    setSearchResults([]);
                    setRedemptionPreview(null);
                    setApplyRedemption(false);
                    setRedemptionPoints(0);
                    setSuccess(false);
                  }}
                  className="premium-btn"
                  style={{ background: '#f1f5f9', color: '#475569', boxShadow: 'none', width: 'auto', padding: '14px 28px' }}
                >
                  New Transaction
                </button>
                <button 
                  onClick={() => navigate('/customers')}
                  className="premium-btn"
                  style={{ width: 'auto', padding: '14px 28px' }}
                >
                  View Customers
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: customer ? '1fr 1fr' : '1fr', gap: '40px', alignItems: 'start' }}>
              
              {/* Left Column: Form / Action */}
              <div style={{ flex: 1 }}>
                {/* Step 1: Find Customer */}
                {!customer && (
                  <div className="animate-fade-in">
                    <form onSubmit={handleSearch}>
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                          Customer Search (Name or Phone)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }}>
                            {searchLoading
                              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#a80028"/></svg>
                              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            }
                          </div>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setError(null); }}
                            onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                            placeholder="Start typing name or phone..."
                            className="premium-input"
                            style={{ paddingLeft: '48px', fontSize: '1.1rem' }}
                            autoComplete="off"
                          />
                          {/* Live Suggestions Dropdown */}
                          {showSuggestions && searchResults.length > 0 && (
                            <div style={{
                              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                              background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden'
                            }}>
                              {searchResults.map((result, idx) => (
                                <div
                                  key={result.id}
                                  onMouseDown={() => selectCustomer(result)}
                                  style={{
                                    padding: '14px 18px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: 'pointer',
                                    borderBottom: idx < searchResults.length - 1 ? '1px solid #f1f5f9' : 'none',
                                    transition: 'background 0.15s'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = '#fdf2f4'}
                                  onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                >
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{result.name}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>{result.phone}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a80028', background: 'rgba(168,0,40,0.07)', padding: '3px 8px', borderRadius: '12px' }}>
                                      {result.totalPoints} PTS
                                    </span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a80028" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button type="submit" disabled={loading || !searchQuery} className="premium-btn">
                        {loading ? 'Searching...' : 'Look Up Customer'}
                      </button>
                    </form>

                    {/* Static multi-match list (fallback when dropdown was dismissed) */}
                    {!showSuggestions && searchResults.length > 1 && (
                      <div style={{ marginTop: '24px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b', marginBottom: '12px' }}>Multiple matches — please select:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                          {searchResults.map(result => (
                            <div key={result.id} onClick={() => selectCustomer(result)}
                              style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                              onMouseOver={e => { e.currentTarget.style.borderColor = '#a80028'; e.currentTarget.style.background = '#fff'; }}
                              onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
                            >
                              <div>
                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{result.name}</div>
                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{result.phone}</div>
                              </div>
                              <span style={{ color: '#a80028', fontWeight: 700, fontSize: '0.85rem', background: 'rgba(168,0,40,0.05)', padding: '5px 12px', borderRadius: '20px' }}>Select →</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Record Purchase */}
                {customer && (
                  <form onSubmit={handleSubmit} className="animate-fade-in">
                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                        Bill Amount (Rs)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', color: '#1e293b', fontWeight: 800, fontSize: '1.4rem' }}>
                          Rs
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          className="premium-input"
                          style={{ paddingLeft: '64px', fontSize: '1.8rem', fontWeight: 700, height: '70px', color: '#0f172a' }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !amount || billAmount <= 0 || success}
                      className="premium-btn"
                      style={{ height: '60px', fontSize: '1.2rem' }}
                    >
                      {loading ? 'Processing...' : 'Confirm Purchase'}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Customer Info & Live Points */}
              {customer && (
                <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Customer Card */}
                  <div className="customer-loyalty-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '4px' }}>Member</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{customer.name}</div>
                        <div style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          {customer.phone}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          setCustomer(null);
                          setAmount('');
                          setRedemptionPreview(null);
                          setApplyRedemption(false);
                          setRedemptionPoints(0);
                          setError(null);
                        }} 
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      >
                        Change
                      </button>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '4px' }}>Current Balance</div>
                      <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>
                        {customer.totalPoints.toLocaleString()} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#cbd5e1' }}>PTS</span>
                      </div>
                    </div>
                  </div>

                  {/* Points Preview Box */}
                  {billAmount > 0 ? (
                    <>
                    <div style={{ background: 'linear-gradient(135deg, #fdf2f4 0%, #fff1f2 100%)', padding: '24px', borderRadius: '16px', border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', color: '#be123c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earning Potential</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#9f1239' }}>+{pointsToEarn}</span>
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#e11d48' }}>PTS</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: 600, marginTop: '4px' }}>
                          New Balance: {(customer.totalPoints + pointsToEarn).toLocaleString()} PTS
                        </div>
                      </div>
                    </div>

                    {/* Redemption Offer Panel */}
                    {redemptionLoading && (
                      <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>Checking offers...</div>
                    )}
                    {!redemptionLoading && redemptionPreview && (
                      <div style={{ borderRadius: '16px', border: `2px solid ${applyRedemption ? '#a80028' : '#e2e8f0'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                        <div style={{ padding: '16px 20px', background: applyRedemption ? 'linear-gradient(135deg,#a80028,#8a0020)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.3rem' }}>🎁</span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: applyRedemption ? '#fff' : '#1e293b' }}>Redemption Offer Available!</div>
                              <div style={{ fontSize: '0.8rem', color: applyRedemption ? 'rgba(255,255,255,0.8)' : '#64748b', marginTop: '2px' }}>Customer has redeemable points</div>
                            </div>
                          </div>
                          <button type="button" onClick={() => setApplyRedemption(v => !v)}
                            style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', background: applyRedemption ? 'rgba(255,255,255,0.2)' : '#a80028', color: '#fff', transition: 'all 0.2s' }}>
                            {applyRedemption ? 'Remove' : 'Apply'}
                          </button>
                        </div>
                        <div style={{ padding: '16px 20px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Points to Redeem</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input type="number" min={settings?.minRedeemPoints ?? 1} max={customer.totalPoints}
                                value={redemptionPoints}
                                onChange={e => setRedemptionPoints(Math.min(Number(e.target.value), customer.totalPoints))}
                                style={{ width: '90px', padding: '6px 10px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, textAlign: 'right', outline: 'none' }} />
                              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>/ {customer.totalPoints}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                            <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>Discount Value</span>
                            <span style={{ fontWeight: 900, fontSize: '1.3rem', color: '#10b981' }}>Rs. {liveDiscount.toFixed(2)}</span>
                          </div>
                          {applyRedemption && (
                            <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: '10px', color: '#059669', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                              ✓ Discount will be applied &amp; SMS sent to customer
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    </>
                  ) : (
                    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '20px', color: '#94a3b8' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>Enter an amount</div>
                        <div style={{ fontSize: '0.85rem' }}>See points preview here</div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Purchases Table Area */}
        <div className="premium-card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Recent Purchases</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Latest 5 transactions
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#fff' }}>
                  <th style={{ padding: '16px 32px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>Date & Time</th>
                  <th style={{ padding: '16px 32px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>Customer Details</th>
                  <th style={{ padding: '16px 32px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>Bill Amount</th>
                  <th style={{ padding: '16px 32px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>Points Earned</th>
                  <th style={{ padding: '16px 32px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>Points Used</th>
                  <th style={{ padding: '16px 32px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>Action</th>
                </tr>
              </thead>
              <tbody style={{ background: '#fff' }}>
                {recentPurchases.length > 0 ? (
                  recentPurchases.map((p) => (
                    <tr key={p.id} className="table-row" style={{ borderBottom: '1px solid #f1f5f9', opacity: p.isVoided ? 0.6 : 1 }}>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.95rem' }}>{new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>{new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>{p.customer?.name || 'Unknown'}</div>
                        <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{p.customer?.phone || '—'}</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '1rem', textDecoration: p.isVoided ? 'line-through' : 'none' }}>Rs {Number(p.amount).toFixed(2)}</div>
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        {p.isVoided ? (
                          <span className="voided-badge">VOIDED</span>
                        ) : (
                          <div className="points-badge">+{p.pointsEarned} PTS</div>
                        )}
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        {p.pointsRedeemed > 0 ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.9rem', background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)' }}>
                            -{p.pointsRedeemed} PTS
                          </div>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.9rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '20px 32px' }}>
                        {p.isVoided ? (
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>—</span>
                        ) : (
                          <button
                            onClick={() => { setVoidTarget(p); setVoidError(null); }}
                            className="void-btn"
                            title="Void this transaction"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Void
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 32px', textAlign: 'center' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      </div>
                      <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>No transactions yet</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Recent purchases will appear here</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Void Confirmation Modal ── */}
        {voidTarget && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div className="animate-fade-in" style={{
              background: '#fff', borderRadius: '20px', padding: '40px',
              maxWidth: '460px', width: '100%',
              boxShadow: '0 25px 60px -10px rgba(0,0,0,0.25)'
            }}>
              {/* Icon */}
              <div style={{ width: '64px', height: '64px', background: '#fff1f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#e11d48' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>

              <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Void Transaction?</h3>
              <p style={{ margin: '0 0 24px', color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
                This will permanently void the purchase of <strong style={{ color: '#1e293b' }}>Rs {Number(voidTarget.amount).toFixed(2)}</strong> for <strong style={{ color: '#1e293b' }}>{voidTarget.customer?.name}</strong>.
              </p>

              {/* Points reversal warning */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div style={{ fontSize: '0.88rem', color: '#9a3412', fontWeight: 600, lineHeight: 1.5 }}>
                  <strong>{voidTarget.pointsEarned} loyalty points</strong> will be reversed from the customer's balance. This action is logged in the audit trail and cannot be undone.
                </div>
              </div>

              {voidError && (
                <div style={{ padding: '12px 16px', background: '#fff1f2', borderLeft: '4px solid #e11d48', borderRadius: '8px', color: '#be123c', fontSize: '0.88rem', fontWeight: 600, marginBottom: '20px' }}>
                  {voidError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setVoidTarget(null); setVoidError(null); }}
                  disabled={voidLoading}
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!voidTarget) return;
                    setVoidLoading(true);
                    setVoidError(null);
                    try {
                      await purchasesApi.void(voidTarget.id);
                      setVoidTarget(null);
                      fetchRecentPurchases();
                    } catch (err: unknown) {
                      const e = err as Error;
                      setVoidError(e.message || 'Failed to void transaction.');
                    } finally {
                      setVoidLoading(false);
                    }
                  }}
                  disabled={voidLoading}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: voidLoading ? 'not-allowed' : 'pointer', opacity: voidLoading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(220,38,38,0.3)' }}
                >
                  {voidLoading ? 'Voiding...' : 'Yes, Void It'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Redemptions Table */}
        <div className="premium-card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Recent Redemptions</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Latest 5 redemptions
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#fff' }}>
                  {['Date & Time', 'Customer', 'Points Redeemed', 'Discount Value', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '16px 28px', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ background: '#fff' }}>
                {recentRedemptions.length > 0 ? recentRedemptions.map(r => (
                  <tr key={r.id} className="table-row" style={{ borderBottom: '1px solid #f1f5f9', opacity: r.isVoided ? 0.6 : 1 }}>
                    <td style={{ padding: '18px 28px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 600, fontSize: '0.95rem' }}>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={{ padding: '18px 28px' }}>
                      <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>{r.customer?.name || '—'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '2px' }}>{r.customer?.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '18px 28px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.9rem', background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)', textDecoration: r.isVoided ? 'line-through' : 'none' }}>
                        -{r.pointsRedeemed} PTS
                      </div>
                    </td>
                    <td style={{ padding: '18px 28px' }}>
                      <div style={{ color: '#1e293b', fontWeight: 800, fontSize: '1rem', textDecoration: r.isVoided ? 'line-through' : 'none' }}>Rs {Number(r.discountValue).toFixed(2)}</div>
                    </td>
                    <td style={{ padding: '18px 28px' }}>
                      {r.isVoided
                        ? <span className="voided-badge">VOIDED</span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>Active</span>}
                    </td>
                    <td style={{ padding: '18px 28px' }}>
                      {r.isVoided
                        ? <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>—</span>
                        : (
                          <button
                            onClick={() => { setVoidRedemptionTarget(r); setVoidRedemptionError(null); }}
                            className="void-btn"
                            title="Void this redemption"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            Void
                          </button>
                        )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px 28px', textAlign: 'center' }}>
                      <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#94a3b8' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      <div style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>No redemptions yet</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Recent redemptions will appear here</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Void Redemption Confirmation Modal */}
        {voidRedemptionTarget && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="animate-fade-in" style={{ background: '#fff', borderRadius: '20px', padding: '40px', maxWidth: '460px', width: '100%', boxShadow: '0 25px 60px -10px rgba(0,0,0,0.25)' }}>
              <div style={{ width: '64px', height: '64px', background: '#fffbeb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#d97706' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Void Redemption?</h3>
              <p style={{ margin: '0 0 24px', color: '#64748b', textAlign: 'center', lineHeight: 1.6 }}>
                This will void the redemption of <strong style={{ color: '#1e293b' }}>{voidRedemptionTarget.pointsRedeemed} points</strong> for <strong style={{ color: '#1e293b' }}>{voidRedemptionTarget.customer?.name}</strong>.
              </p>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}><polyline points="20 6 9 17 4 12"/></svg>
                <div style={{ fontSize: '0.88rem', color: '#15803d', fontWeight: 600, lineHeight: 1.5 }}>
                  <strong>{voidRedemptionTarget.pointsRedeemed} loyalty points</strong> will be restored to the customer's balance. This action is logged in the audit trail.
                </div>
              </div>
              {voidRedemptionError && (
                <div style={{ padding: '12px 16px', background: '#fff1f2', borderLeft: '4px solid #e11d48', borderRadius: '8px', color: '#be123c', fontSize: '0.88rem', fontWeight: 600, marginBottom: '20px' }}>{voidRedemptionError}</div>
              )}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setVoidRedemptionTarget(null); setVoidRedemptionError(null); }}
                  disabled={voidRedemptionLoading}
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
                >Cancel</button>
                <button
                  onClick={async () => {
                    if (!voidRedemptionTarget) return;
                    setVoidRedemptionLoading(true);
                    setVoidRedemptionError(null);
                    try {
                      await redemptionsApi.void(voidRedemptionTarget.id);
                      setVoidRedemptionTarget(null);
                      fetchRecentRedemptions();
                    } catch (err: unknown) {
                      const e = err as Error;
                      setVoidRedemptionError(e.message || 'Failed to void redemption.');
                    } finally {
                      setVoidRedemptionLoading(false);
                    }
                  }}
                  disabled={voidRedemptionLoading}
                  style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#d97706,#b45309)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: voidRedemptionLoading ? 'not-allowed' : 'pointer', opacity: voidRedemptionLoading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(217,119,6,0.3)' }}
                >{voidRedemptionLoading ? 'Voiding...' : 'Yes, Restore Points'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .premium-card {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.06);
          border: 1px solid rgba(226, 232, 240, 0.8);
          transition: all 0.3s ease;
        }
        .premium-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1.1rem;
          outline: none;
          transition: all 0.2s ease;
          background: #f8fafc;
          color: #1e293b;
          box-sizing: border-box;
        }
        .premium-input:focus {
          border-color: #a80028;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(168, 0, 40, 0.1);
        }
        .premium-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #a80028 0%, #8a0020 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(168, 0, 40, 0.25);
        }
        .premium-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(168, 0, 40, 0.35);
        }
        .premium-btn:disabled {
          background: #cbd5e1;
          box-shadow: none;
          color: #fff;
          cursor: not-allowed;
          transform: none;
        }
        .customer-loyalty-card {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-radius: 20px;
          padding: 32px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.4);
        }
        .customer-loyalty-card::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
          background-size: 200% 200%;
          animation: shimmer 3s infinite linear;
          pointer-events: none;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .points-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 0.9rem;
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .voided-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          background: rgba(100,116,139,0.1);
          color: #64748b;
          border: 1px solid rgba(100,116,139,0.25);
        }
        .void-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid #fecaca;
          background: #fff1f2;
          color: #dc2626;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .void-btn:hover {
          background: #dc2626;
          color: #fff;
          border-color: #dc2626;
          box-shadow: 0 4px 12px rgba(220,38,38,0.25);
        }
        .table-row {
          transition: background 0.2s;
        }
        .table-row:hover {
          background: #f8fafc !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .receipt-card {
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          border: 1px dashed #cbd5e1;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .receipt-card::before, .receipt-card::after {
          content: '';
          position: absolute;
          width: 30px; height: 30px;
          background: #fff;
          border-radius: 50%;
          top: 50%;
          transform: translateY(-50%);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.04);
        }
        .receipt-card::before { left: -15px; border-right: 1px dashed #cbd5e1; }
        .receipt-card::after { right: -15px; border-left: 1px dashed #cbd5e1; }
      `}</style>
    </div>
  );
}
