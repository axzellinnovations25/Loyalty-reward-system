import { useEffect, useState } from 'react';
import { customersApi } from '../../api/customers';
import { redemptionsApi } from '../../api/redemptions';
import type { Customer, RedemptionPreview } from '../../types';

function unwrap(res: any): any {
  return res?.data ?? res;
}

export default function RedeemPage() {
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [points, setPoints] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [preview, setPreview] = useState<RedemptionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2 || customer) {
      setCustomers([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await customersApi.list({ search: query, limit: 8 });
      const payload = unwrap(res);
      setCustomers(payload.items ?? (Array.isArray(payload) ? payload : []));
    }, 250);
    return () => clearTimeout(t);
  }, [customer, query]);

  useEffect(() => {
    if (!customer || Number(points) <= 0) {
      setPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await redemptionsApi.preview(customer.id, Number(points));
        setPreview(unwrap(res));
      } catch {
        setPreview(null);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [customer, points]);

  async function redeem() {
    if (!customer) return;
    setLoading(true);
    setMessage(null);
    try {
      await redemptionsApi.create({ customerId: customer.id, pointsRedeemed: Number(points), billAmount: Number(billAmount || 0), notes: 'Standalone reward redemption' });
      setMessage('Redemption recorded successfully.');
      setCustomer(null);
      setQuery('');
      setPoints('');
      setBillAmount('');
      setPreview(null);
    } catch (err: any) {
      setMessage(err.message || 'Failed to redeem points.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Redeem Rewards</h1>
          <p className="adm-page-subtitle">Look up a member and redeem loyalty points outside a POS sale.</p>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 20, maxWidth: 720 }}>
        {message && <div className="adm-alert" style={{ marginBottom: 14 }}>{message}</div>}
        {!customer ? (
          <div style={{ position: 'relative' }}>
            <label className="adm-label">Customer</label>
            <input className="adm-input" autoFocus placeholder="Search name or phone..." value={query} onChange={(e) => setQuery(e.target.value)} />
            {customers.length > 0 && (
              <div className="adm-card" style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, marginTop: 8, overflow: 'hidden' }}>
                {customers.map((c) => (
                  <button key={c.id} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: 12, border: 0, borderBottom: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }} onClick={() => { setCustomer(c); setQuery(c.name); setPoints(String(Math.min(c.totalPoints, c.totalPoints || 0))); }}>
                    <span style={{ fontWeight: 800 }}>{c.name} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{c.phone}</span></span>
                    <span>{c.totalPoints.toLocaleString()} pts</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div><div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{customer.name}</div><div style={{ color: 'var(--text-secondary)' }}>{customer.phone}</div></div>
              <button className="adm-btn adm-btn--ghost" onClick={() => setCustomer(null)}>Change</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label className="adm-label">Bill amount</label><input className="adm-input" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} /></div>
              <div><label className="adm-label">Points to redeem</label><input className="adm-input" value={points} onChange={(e) => setPoints(e.target.value)} /></div>
            </div>
            <div className="adm-card" style={{ padding: 16, marginTop: 14, background: 'var(--n-50)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Available</span><strong>{customer.totalPoints.toLocaleString()} pts</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>Discount</span><strong>Rs. {Number(preview?.discountValue || 0).toFixed(2)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><span>Remaining</span><strong>{Number(preview?.remainingPoints ?? customer.totalPoints).toLocaleString()} pts</strong></div>
            </div>
            <button className="adm-btn adm-btn--primary" style={{ marginTop: 16 }} disabled={loading || !preview} onClick={redeem}>{loading ? 'Redeeming...' : 'Confirm Redemption'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
