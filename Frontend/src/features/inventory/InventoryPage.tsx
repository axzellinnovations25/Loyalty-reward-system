import { useCallback, useEffect, useMemo, useState } from 'react';
import { productsApi } from '../../api/products';
import { posApi } from '../../api/pos';
import type { Product } from '../../types';
import type { StockMovement } from '../../types/pos';

function unwrap(res: any): any {
  return res?.data ?? res;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('stock_count');
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.list({ includeInactive: true, limit: 500 });
      const payload = unwrap(res);
      const listPayload = payload.data ?? payload;
      setProducts(listPayload.items ?? (Array.isArray(listPayload) ? listPayload : []));
      const movementRes = await posApi.stockMovements({ limit: 20 });
      const movementPayload = unwrap(movementRes);
      setMovements(movementPayload.items ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode || '').toLowerCase().includes(q));
  }, [products, search]);

  const lowCount = products.filter((p) => p.trackInventory && p.stockOnHand <= p.reorderLevel).length;
  const totalUnits = products.reduce((sum, p) => sum + (p.trackInventory ? Number(p.stockOnHand || 0) : 0), 0);

  async function saveAdjustment() {
    if (!adjusting) return;
    const nextQty = Number(quantity);
    if (!Number.isInteger(nextQty) || nextQty < 0) {
      alert('Enter a valid stock quantity.');
      return;
    }
    await posApi.adjustStock({
      productId: adjusting.id,
      quantityDelta: nextQty - Number(adjusting.stockOnHand || 0),
      movementType: reason === 'received' ? 'receiving' : reason === 'damage' ? 'waste' : 'adjustment',
      reason,
    });
    setAdjusting(null);
    setQuantity('');
    setReason('stock_count');
    load();
  }

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Inventory</h1>
          <p className="adm-page-subtitle">Stock counts, low-stock checks, and manual adjustments.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
        <div className="adm-card" style={{ padding: 18 }}><div style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Tracked units</div><div style={{ fontSize: 28, fontWeight: 900 }}>{totalUnits}</div></div>
        <div className="adm-card" style={{ padding: 18 }}><div style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Low stock</div><div style={{ fontSize: 28, fontWeight: 900, color: lowCount ? 'var(--danger)' : 'var(--success)' }}>{lowCount}</div></div>
        <div className="adm-card" style={{ padding: 18 }}><div style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>Products</div><div style={{ fontSize: 28, fontWeight: 900 }}>{products.length}</div></div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap" style={{ maxWidth: 440 }}>
          <input className="adm-search" placeholder="Search item / SKU / barcode..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="adm-alert adm-alert--error">{error}</div>}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Item</th><th>SKU</th><th style={{ textAlign: 'center' }}>On hand</th><th style={{ textAlign: 'center' }}>Reorder</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'right' }}></th></tr></thead>
          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="adm-empty">No inventory items found.</div></td></tr>
            ) : filtered.map((p) => {
              const low = p.trackInventory && p.stockOnHand <= p.reorderLevel;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 800 }}>{p.name}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p.sku}</td>
                  <td style={{ textAlign: 'center', fontWeight: 900 }}>{p.trackInventory ? p.stockOnHand : '-'}</td>
                  <td style={{ textAlign: 'center' }}>{p.trackInventory ? p.reorderLevel : '-'}</td>
                  <td style={{ textAlign: 'center' }}><span className={`adm-badge ${low ? 'adm-badge--maroon' : 'adm-badge--success'}`}>{low ? 'Low' : 'OK'}</span></td>
                  <td style={{ textAlign: 'right' }}><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => { setAdjusting(p); setQuantity(String(p.stockOnHand ?? 0)); }}>Adjust</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjusting && (
        <div className="adm-modal-overlay">
          <div className="adm-modal" style={{ maxWidth: 460 }}>
            <div className="adm-modal-header">
              <div><p className="adm-modal-title">Adjust Stock</p><p className="adm-modal-subtitle">{adjusting.name}</p></div>
              <button className="adm-modal-close" onClick={() => setAdjusting(null)}>x</button>
            </div>
            <div className="adm-modal-body">
              <label className="adm-label">New stock on hand</label>
              <input className="adm-input" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <label className="adm-label" style={{ marginTop: 12 }}>Reason</label>
              <select className="adm-input" value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="stock_count">Stock count</option>
                <option value="received">Received stock</option>
                <option value="damage">Damaged / waste</option>
                <option value="correction">Correction</option>
              </select>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>This creates a stock movement ledger entry and updates stock on hand.</p>
            </div>
            <div className="adm-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setAdjusting(null)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={saveAdjustment}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="adm-table-wrap" style={{ marginTop: 18 }}>
        <table className="adm-table">
          <thead><tr><th>Recent Movement</th><th>Type</th><th style={{ textAlign: 'center' }}>Delta</th><th style={{ textAlign: 'right' }}>After</th><th>Reason</th></tr></thead>
          <tbody>
            {movements.length === 0 ? (
              <tr><td colSpan={5}><div className="adm-empty">No stock movements yet.</div></td></tr>
            ) : movements.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 800 }}>{m.product?.name || '-'}</td>
                <td>{m.movementType}</td>
                <td style={{ textAlign: 'center', fontWeight: 900 }}>{m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}</td>
                <td style={{ textAlign: 'right' }}>{m.stockAfter}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{m.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
