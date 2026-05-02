import { useCallback, useEffect, useMemo, useState } from 'react';
import { posApi } from '../../api/pos';
import type { RegisterShift } from '../../types/pos';

function unwrap<T>(res: any): T {
  return (res?.data ?? res) as T;
}

function money(value: unknown): string {
  return `Rs. ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<RegisterShift[]>([]);
  const [openShift, setOpenShift] = useState<RegisterShift | null>(null);
  const [openingCash, setOpeningCash] = useState('0');
  const [closingCash, setClosingCash] = useState('');
  const [cashMove, setCashMove] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentRes, listRes] = await Promise.all([posApi.currentShift(), posApi.shifts({ limit: 50 })]);
      setOpenShift(unwrap<RegisterShift | null>(currentRes));
      const payload = unwrap<any>(listRes);
      setShifts(payload.items ?? (Array.isArray(payload) ? payload : []));
    } catch (err: any) {
      setError(err.message || 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTotals = useMemo(() => {
    if (!openShift) return { cashPayments: 0, expectedCash: 0 };
    const cashPayments = (openShift.payments || [])
      .filter((p) => p.tenderType === 'cash' && p.status === 'captured')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    return { cashPayments, expectedCash: Number(openShift.expectedCash || 0) + cashPayments };
  }, [openShift]);

  async function startShift() {
    try {
      await posApi.openShift({ openingCash: Number(openingCash || 0) });
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to open shift.');
    }
  }

  async function addCash(type: 'cash_in' | 'cash_out') {
    if (!openShift) return;
    try {
      await posApi.cashEvent(openShift.id, { eventType: type, amount: Number(cashMove || 0), reason: note || undefined });
      setCashMove('');
      setNote('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to record cash event.');
    }
  }

  async function closeShift() {
    if (!openShift) return;
    try {
      await posApi.closeShift(openShift.id, { closingCash: Number(closingCash || 0), note: note || undefined });
      setClosingCash('');
      setNote('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to close shift.');
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Register Shifts</h1>
          <p className="adm-page-subtitle">Persisted register opening, cash events, closeout, and variance.</p>
        </div>
      </div>

      {error && <div className="adm-alert adm-alert--error">{error}</div>}

      <div className="adm-card" style={{ padding: 18, marginBottom: 18 }}>
        {openShift ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>Open shift</div>
              <p style={{ color: 'var(--text-secondary)' }}>Opened {new Date(openShift.openedAt).toLocaleString('en-GB')}</p>
              <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                <div>Opening cash: <strong>{money(openShift.openingCash)}</strong></div>
                <div>Cash payments: <strong>{money(openTotals.cashPayments)}</strong></div>
                <div>Expected cash: <strong>{money(openTotals.expectedCash)}</strong></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="adm-input" placeholder="Cash amount" value={cashMove} onChange={(e) => setCashMove(e.target.value)} />
                <button className="adm-btn adm-btn--ghost" onClick={() => addCash('cash_in')}>Cash In</button>
                <button className="adm-btn adm-btn--ghost" onClick={() => addCash('cash_out')}>Cash Out</button>
              </div>
            </div>
            <div>
              <label className="adm-label">Closing cash</label>
              <input className="adm-input" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} />
              <label className="adm-label" style={{ marginTop: 10 }}>Note / reason</label>
              <input className="adm-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
              <button className="adm-btn adm-btn--primary" style={{ marginTop: 12 }} onClick={closeShift}>Close Shift</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'end', maxWidth: 420 }}>
            <div style={{ flex: 1 }}>
              <label className="adm-label">Opening cash</label>
              <input className="adm-input" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} />
            </div>
            <button className="adm-btn adm-btn--primary" onClick={startShift}>Open Shift</button>
          </div>
        )}
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Cashier</th><th>Opened</th><th>Closed</th><th style={{ textAlign: 'right' }}>Opening</th><th style={{ textAlign: 'right' }}>Expected</th><th style={{ textAlign: 'right' }}>Closing</th><th style={{ textAlign: 'right' }}>Variance</th></tr></thead>
          <tbody>
            {!loading && shifts.length === 0 ? (
              <tr><td colSpan={7}><div className="adm-empty">No shifts recorded yet.</div></td></tr>
            ) : shifts.map((s) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 800 }}>{(s as any).user?.name || '-'}</td>
                <td>{new Date(s.openedAt).toLocaleString('en-GB')}</td>
                <td>{s.closedAt ? new Date(s.closedAt).toLocaleString('en-GB') : <span className="adm-badge adm-badge--success">Open</span>}</td>
                <td style={{ textAlign: 'right' }}>{money(s.openingCash)}</td>
                <td style={{ textAlign: 'right' }}>{money(s.expectedCash)}</td>
                <td style={{ textAlign: 'right' }}>{s.closingCash == null ? '-' : money(s.closingCash)}</td>
                <td style={{ textAlign: 'right', fontWeight: 900 }}>{s.variance == null ? '-' : money(s.variance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
