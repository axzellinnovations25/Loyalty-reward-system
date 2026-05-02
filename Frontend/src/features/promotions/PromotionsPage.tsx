import { useCallback, useEffect, useMemo, useState } from 'react';
import { promotionsApi } from '../../api/promotions';
import type { Promotion, PromotionKind } from '../../types';

function kindLabel(k: PromotionKind): string {
  switch (k) {
    case 'cart_percent': return 'Cart % off';
    case 'cart_amount': return 'Cart amount off';
    case 'item_percent': return 'Item % off';
    case 'item_amount': return 'Item amount off';
    case 'bogo': return 'BOGO';
    case 'happy_hour_price': return 'Happy hour price';
    default: return k;
  }
}

function isoToLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

const DEFAULT_CONFIG: Record<PromotionKind, Record<string, unknown>> = {
  cart_percent: { percent: 10, maxDiscount: null, minSubtotal: null },
  cart_amount: { amount: 100, minSubtotal: null },
  item_percent: { percent: 10, productIds: [], categoryIds: [] },
  item_amount: { amount: 50, productIds: [], categoryIds: [] },
  bogo: { buyQty: 1, getQty: 1, percentOff: 100, productIds: [], categoryIds: [] },
  happy_hour_price: { price: 99, productIds: [], categoryIds: [] },
};

export default function PromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<PromotionKind>('cart_percent');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(100);
  const [stackable, setStackable] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [perCustomerLimit, setPerCustomerLimit] = useState<string>('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);

  const [configText, setConfigText] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await promotionsApi.list();
      const payload = (res as any).data ?? res;
      setItems(Array.isArray(payload) ? payload : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load promotions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setKind('cart_percent');
    setIsActive(true);
    setPriority(100);
    setStackable(false);
    setCouponCode('');
    setUsageLimit('');
    setPerCustomerLimit('');
    setStartAt('');
    setEndAt('');
    setStartTime('');
    setEndTime('');
    setDaysOfWeek([]);
    setConfigText(JSON.stringify(DEFAULT_CONFIG.cart_percent, null, 2));
    setIsModalOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setName(p.name);
    setDescription(p.description || '');
    setKind(p.kind);
    setIsActive(p.isActive);
    setPriority(p.priority);
    setStackable(p.stackable);
    setCouponCode(p.couponCode || '');
    setUsageLimit(p.usageLimit == null ? '' : String(p.usageLimit));
    setPerCustomerLimit(p.perCustomerLimit == null ? '' : String(p.perCustomerLimit));
    setStartAt(isoToLocalInput(p.startAt || null));
    setEndAt(isoToLocalInput(p.endAt || null));
    setStartTime(p.startTime || '');
    setEndTime(p.endTime || '');
    setDaysOfWeek(Array.isArray(p.daysOfWeek) ? p.daysOfWeek : []);
    setConfigText(JSON.stringify(p.config || DEFAULT_CONFIG[p.kind], null, 2));
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen || editing) return;
    setConfigText(JSON.stringify(DEFAULT_CONFIG[kind], null, 2));
  }, [editing, isModalOpen, kind]);

  const scheduleLabel = useMemo(() => {
    const parts: string[] = [];
    if (startAt) parts.push(`From ${startAt.replace('T', ' ')}`);
    if (endAt) parts.push(`To ${endAt.replace('T', ' ')}`);
    if (startTime || endTime) parts.push(`Time ${startTime || '00:00'}-${endTime || '23:59'}`);
    if (daysOfWeek.length > 0) parts.push(`Days: ${daysOfWeek.sort().join(',')}`);
    return parts.join(' • ') || 'Always';
  }, [daysOfWeek, endAt, startAt, startTime, endTime]);

  const save = async () => {
    let config: any;
    try {
      config = JSON.parse(configText || '{}');
    } catch {
      alert('Config must be valid JSON.');
      return;
    }

    const payload: any = {
      name,
      description: description || null,
      kind,
      isActive,
      priority,
      stackable,
      couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
      usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
      perCustomerLimit: perCustomerLimit.trim() ? Number(perCustomerLimit) : null,
      startAt: localInputToIso(startAt),
      endAt: localInputToIso(endAt),
      startTime: startTime.trim() ? startTime.trim() : null,
      endTime: endTime.trim() ? endTime.trim() : null,
      daysOfWeek,
      config,
    };

    try {
      if (editing) {
        await promotionsApi.update(editing.id, payload);
      } else {
        await promotionsApi.create(payload);
      }
      setIsModalOpen(false);
      await fetchAll();
    } catch (e: any) {
      alert(e.message || 'Failed to save promotion.');
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Promotions</h1>
          <p className="adm-page-subtitle">
            {loading ? 'Loading…' : `${items.length} promotion${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={openCreate}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Promotion
        </button>
      </div>

      {error && (
        <div className="adm-alert adm-alert--error" role="alert">
          {error}
        </div>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Coupon</th>
              <th>Schedule</th>
              <th style={{ textAlign: 'center' }}>Active</th>
              <th style={{ textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {!loading && items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="adm-empty">
                    <div className="adm-empty-title">No promotions yet</div>
                    <div className="adm-empty-desc">Create a promotion to enable discounts in POS.</div>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800 }}>{p.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{kindLabel(p.kind)}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                    {p.couponCode ? p.couponCode : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {(p.startAt || p.endAt || (p.daysOfWeek?.length ?? 0) > 0 || p.startTime || p.endTime)
                      ? 'Scheduled'
                      : 'Always'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`adm-badge ${p.isActive ? 'adm-badge--success' : 'adm-badge--gray'}`}>
                      {p.isActive ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openEdit(p)}>
                        Edit
                      </button>
                      <button
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={async () => {
                          if (!confirm(`Delete promotion "${p.name}"?`)) return;
                          try {
                            await promotionsApi.remove(p.id);
                            fetchAll();
                          } catch (e: any) {
                            alert(e.message || 'Failed to delete promotion.');
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div className="adm-card" style={{ width: 'min(920px, 100%)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontWeight: 900, fontSize: '1.05rem' }}>{editing ? 'Edit Promotion' : 'New Promotion'}</div>
              <div style={{ marginLeft: 'auto' }}>
                <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setIsModalOpen(false)}>Close</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="adm-label">Name</label>
                <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="adm-label">Type</label>
                <select className="adm-input" value={kind} onChange={(e) => setKind(e.target.value as PromotionKind)}>
                  <option value="cart_percent">Cart % off</option>
                  <option value="cart_amount">Cart amount off</option>
                  <option value="item_percent">Item % off</option>
                  <option value="item_amount">Item amount off</option>
                  <option value="bogo">BOGO (buy X get Y)</option>
                  <option value="happy_hour_price">Happy hour fixed price</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="adm-label">Description</label>
                <input className="adm-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Active</span>
                </label>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" checked={stackable} onChange={(e) => setStackable(e.target.checked)} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Stackable</span>
                </label>
              </div>

              <div>
                <label className="adm-label">Priority (lower = earlier)</label>
                <input className="adm-input" type="number" min={1} value={priority} onChange={(e) => setPriority(Number(e.target.value))} />
              </div>

              <div>
                <label className="adm-label">Coupon Code (optional)</label>
                <input className="adm-input" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. SAVE10" />
              </div>
              <div>
                <label className="adm-label">Usage Limit (optional)</label>
                <input className="adm-input" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="e.g. 100" />
              </div>
              <div>
                <label className="adm-label">Per-Customer Limit (optional)</label>
                <input className="adm-input" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(e.target.value)} placeholder="e.g. 1" />
              </div>

              <div>
                <label className="adm-label">Start At (optional)</label>
                <input className="adm-input" type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div>
                <label className="adm-label">End At (optional)</label>
                <input className="adm-input" type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Start Time (optional)</label>
                <input className="adm-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} placeholder="HH:MM" />
              </div>
              <div>
                <label className="adm-label">End Time (optional)</label>
                <input className="adm-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} placeholder="HH:MM" />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="adm-label">Days of Week (optional)</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { d: 0, label: 'Sun' },
                    { d: 1, label: 'Mon' },
                    { d: 2, label: 'Tue' },
                    { d: 3, label: 'Wed' },
                    { d: 4, label: 'Thu' },
                    { d: 5, label: 'Fri' },
                    { d: 6, label: 'Sat' },
                  ].map(({ d, label }) => (
                    <label key={d} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={daysOfWeek.includes(d)}
                        onChange={(e) => {
                          setDaysOfWeek((prev) => (e.target.checked ? [...prev, d] : prev.filter((x) => x !== d)));
                        }}
                      />
                      <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  {scheduleLabel}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label className="adm-label">Config (JSON)</label>
                <textarea
                  className="adm-input"
                  value={configText}
                  onChange={(e) => setConfigText(e.target.value)}
                  style={{ minHeight: 180, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '0.85rem' }}
                />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Tips: use `productIds` or `categoryIds` arrays to target items. For BOGO: `buyQty`, `getQty`, `percentOff`.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

