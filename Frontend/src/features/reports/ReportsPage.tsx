import { useEffect, useMemo, useState } from 'react';
import { reportsApi } from '../../api/reports';
import { purchasesApi } from '../../api/purchases';
import { posApi } from '../../api/pos';
import type { DashboardSummary, DayStats, Purchase, TopCustomerStats } from '../../types';

function unwrap<T>(res: any): T {
  return (res?.data ?? res) as T;
}

function money(v: unknown): string {
  return `Rs. ${Number(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [days, setDays] = useState<DayStats[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomerStats[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [professional, setProfessional] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, daysRes, topRes, salesRes, professionalRes] = await Promise.all([
          reportsApi.getSummary(from || undefined, to || undefined),
          reportsApi.getPurchasesByDay(from || undefined, to || undefined),
          reportsApi.getTopCustomers(10),
          purchasesApi.list({ limit: 100 }),
          posApi.professionalReport({ from: from || undefined, to: to || undefined }),
        ]);
        if (!alive) return;
        setSummary(unwrap<DashboardSummary>(summaryRes));
        setDays(unwrap<DayStats[]>(daysRes));
        setTopCustomers(unwrap<TopCustomerStats[]>(topRes));
        const payload = unwrap<any>(salesRes);
        setSales(payload.items ?? (Array.isArray(payload) ? payload : []));
        setProfessional(unwrap<any>(professionalRes));
      } catch (err: any) {
        if (alive) setError(err.message || 'Failed to load reports.');
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [from, to]);

  const paymentTotals = useMemo(() => {
    const completed = sales.filter((s) => !s.isVoided);
    return {
      count: completed.length,
      revenue: completed.reduce((sum, s) => sum + Number(s.amount || 0), 0),
      discounts: completed.reduce((sum, s) => sum + Number(s.discountTotal || 0), 0),
      points: completed.reduce((sum, s) => sum + Number(s.pointsEarned || 0), 0),
    };
  }, [sales]);

  const topItems = useMemo(() => {
    const byName = new Map<string, { name: string; qty: number; total: number }>();
    for (const sale of sales) {
      if (sale.isVoided) continue;
      for (const item of sale.items || []) {
        const prev = byName.get(item.name) || { name: item.name, qty: 0, total: 0 };
        prev.qty += Number(item.quantity || 0);
        prev.total += Number(item.lineTotal || 0);
        byName.set(item.name, prev);
      }
    }
    return [...byName.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [sales]);

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Reports</h1>
          <p className="adm-page-subtitle">Sales, item, customer, discount, and tax summaries.</p>
        </div>
      </div>

      <div className="adm-toolbar" style={{ gap: 10, flexWrap: 'wrap' }}>
        <input className="adm-input" style={{ width: 180 }} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="adm-input" style={{ width: 180 }} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="adm-btn adm-btn--ghost" onClick={() => { setFrom(''); setTo(''); }}>Clear</button>
      </div>

      {error && <div className="adm-alert adm-alert--error">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
        {[
          ['Revenue', money(summary?.totalRevenue ?? paymentTotals.revenue)],
          ['Transactions', loading ? '...' : String(summary?.totalPurchases ?? paymentTotals.count)],
          ['Discounts', money(paymentTotals.discounts)],
          ['Points Issued', paymentTotals.points.toLocaleString()],
        ].map(([label, value]) => (
          <div className="adm-card" style={{ padding: 18 }} key={label}>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18, alignItems: 'start' }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Day</th><th style={{ textAlign: 'center' }}>Sales</th><th style={{ textAlign: 'right' }}>Revenue</th></tr></thead>
            <tbody>
              {days.length === 0 ? (
                <tr><td colSpan={3}><div className="adm-empty">No daily sales in this period.</div></td></tr>
              ) : days.map((d) => (
                <tr key={d.day}>
                  <td style={{ fontWeight: 800 }}>{new Date(d.day).toLocaleDateString('en-GB')}</td>
                  <td style={{ textAlign: 'center' }}>{d.count}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900 }}>{money(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Top Item</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Revenue</th></tr></thead>
            <tbody>
              {topItems.length === 0 ? (
                <tr><td colSpan={3}><div className="adm-empty">No item sales yet.</div></td></tr>
              ) : topItems.map((it) => (
                <tr key={it.name}>
                  <td style={{ fontWeight: 800 }}>{it.name}</td>
                  <td style={{ textAlign: 'center' }}>{it.qty}</td>
                  <td style={{ textAlign: 'right', fontWeight: 900 }}>{money(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 18 }}>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Payment Method</th><th style={{ textAlign: 'center' }}>Count</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {(professional?.payments || []).length === 0 ? (
                <tr><td colSpan={3}><div className="adm-empty">No payment ledger entries.</div></td></tr>
              ) : professional.payments.map((p: any) => (
                <tr key={p.tenderType}><td>{p.tenderType}</td><td style={{ textAlign: 'center' }}>{p._count}</td><td style={{ textAlign: 'right', fontWeight: 900 }}>{money(p._sum.amount)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="adm-card" style={{ padding: 18 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax collected</span><strong>{money(professional?.tax?.taxTotal)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discounts</span><strong>{money(professional?.tax?.discountTotal)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Refunds</span><strong>{money(professional?.refunds?._sum?.amount)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Inventory value</span><strong>{money(professional?.inventoryValue)}</strong></div>
          </div>
        </div>
      </div>

      <div className="adm-table-wrap" style={{ marginTop: 18 }}>
        <table className="adm-table">
          <thead><tr><th>Top Customer ID</th><th style={{ textAlign: 'center' }}>Visits</th><th style={{ textAlign: 'right' }}>Spend</th><th style={{ textAlign: 'right' }}>Points</th></tr></thead>
          <tbody>
            {topCustomers.length === 0 ? (
              <tr><td colSpan={4}><div className="adm-empty">No customer ranking available.</div></td></tr>
            ) : topCustomers.map((c) => (
              <tr key={c.customerId}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.customerId}</td>
                <td style={{ textAlign: 'center' }}>{c._count}</td>
                <td style={{ textAlign: 'right', fontWeight: 900 }}>{money(c._sum.amount)}</td>
                <td style={{ textAlign: 'right' }}>{Number(c._sum.pointsEarned || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
