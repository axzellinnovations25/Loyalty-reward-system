import { useEffect, useMemo, useRef, useState } from 'react';
import { productsApi } from '../../../api/products';
import type { Product, ProductCategory } from '../../../types';

function toStringOrEmpty(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

export default function EditProductModal({
  product,
  categories,
  onClose,
  onSuccess,
}: {
  product: Product;
  categories: ProductCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [barcode, setBarcode] = useState(product.barcode || '');
  const [categoryId, setCategoryId] = useState(product.categoryId || '');
  const [imageUrl, setImageUrl] = useState(product.imageUrl || '');
  const [unit, setUnit] = useState(product.unit || '');
  const [price, setPrice] = useState(toStringOrEmpty(product.price));
  const [cost, setCost] = useState(toStringOrEmpty(product.cost));
  const [taxRate, setTaxRate] = useState(toStringOrEmpty(product.taxRate));
  const [trackInventory, setTrackInventory] = useState(product.trackInventory);
  const [stockOnHand, setStockOnHand] = useState(String(product.stockOnHand ?? 0));
  const [reorderLevel, setReorderLevel] = useState(String(product.reorderLevel ?? 0));
  const [isActive, setIsActive] = useState(product.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const categoryOptions = useMemo(
    () => categories.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required.');
    if (!sku.trim()) return setError('SKU is required.');

    setLoading(true);
    setError(null);
    try {
      await productsApi.update(product.id, {
        name: name.trim(),
        sku: sku.trim(),
        barcode: barcode.trim() ? barcode.trim() : null,
        categoryId: categoryId || null,
        unit: unit.trim() || '',
        imageUrl: imageUrl.trim() || '',
        price: price.trim() ? Number(price) : 0,
        cost: cost.trim() ? Number(cost) : null,
        taxRate: taxRate.trim() ? Number(taxRate) : null,
        trackInventory,
        stockOnHand: trackInventory ? parseInt(stockOnHand || '0', 10) : 0,
        reorderLevel: trackInventory ? parseInt(reorderLevel || '0', 10) : 0,
        isActive,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="adm-modal-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="adm-modal" style={{ maxWidth: 720 }}>
        <div className="adm-modal-header">
          <div>
            <p className="adm-modal-title">Edit Product</p>
            <p className="adm-modal-subtitle">{product.name}</p>
          </div>
          <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="adm-modal-body">
            {error && (
              <div className="adm-alert adm-alert--error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="adm-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="adm-form-group">
                <label className="adm-label">
                  Name <span className="adm-label-required">*</span>
                </label>
                <input ref={nameRef} className="adm-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">
                  SKU <span className="adm-label-required">*</span>
                </label>
                <input className="adm-input" value={sku} onChange={(e) => setSku(e.target.value)} required />
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Barcode</label>
                <input className="adm-input" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Category</label>
                <select className="adm-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Uncategorized</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Unit</label>
                <input className="adm-input" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Image URL</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <input className="adm-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                  {imageUrl && (
                    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                      <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Price</label>
                <input className="adm-input" value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
              </div>
              <div className="adm-form-group">
                <label className="adm-label">Cost</label>
                <input className="adm-input" value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" />
              </div>

              <div className="adm-form-group">
                <label className="adm-label">Tax Rate (%)</label>
                <input className="adm-input" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" />
              </div>
              <div />

              <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} />
                  Track inventory
                </label>
              </div>

              {trackInventory && (
                <>
                  <div className="adm-form-group">
                    <label className="adm-label">Stock on hand</label>
                    <input className="adm-input" value={stockOnHand} onChange={(e) => setStockOnHand(e.target.value)} inputMode="numeric" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-label">Reorder level</label>
                    <input className="adm-input" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} inputMode="numeric" />
                  </div>
                </>
              )}

              <div className="adm-form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="adm-spinner" style={{ marginRight: 6 }} /> Saving…
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

