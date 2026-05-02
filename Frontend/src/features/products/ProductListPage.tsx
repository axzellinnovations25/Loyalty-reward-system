import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { posApi } from '../../api/pos';
import type { Product, ProductCategory } from '../../types';
import AddProductModal from './modals/AddProductModal';
import EditProductModal from './modals/EditProductModal';

function toNumber(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ProductListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [lowStock, setLowStock] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [advancedProduct, setAdvancedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);
  const [variantForm, setVariantForm] = useState({ name: '', sku: '', barcode: '', price: '', stockOnHand: '0' });
  const [modifierForm, setModifierForm] = useState({ name: '', optionName: '', priceDelta: '0' });
  const [total, setTotal] = useState(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, productsRes] = await Promise.all([
        productsApi.listCategories(),
        productsApi.list({
          search: search || undefined,
          categoryId: categoryId || undefined,
          includeInactive: includeInactive ? true : undefined,
          lowStock: lowStock ? true : undefined,
        }),
      ]);

      const catsPayload = (catsRes as any).data ?? catsRes;
      setCategories(Array.isArray(catsPayload) ? catsPayload : []);

      const listPayload = (productsRes as any).data ?? productsRes;
      const items = listPayload.items ?? (Array.isArray(listPayload) ? listPayload : []);
      const metaTotal = listPayload.meta?.total ?? items.length;
      setProducts(items);
      setTotal(metaTotal);
    } catch (err: any) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [categoryId, includeInactive, lowStock, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchAll();
    }, 350);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  const openAdvanced = async (product: Product) => {
    setAdvancedProduct(product);
    const [variantRes, modifierRes] = await Promise.all([
      posApi.variants(product.id),
      posApi.modifierGroups(product.id),
    ]);
    setVariants(((variantRes as any).data ?? variantRes) as any[]);
    setModifierGroups(((modifierRes as any).data ?? modifierRes) as any[]);
  };

  const saveVariant = async () => {
    if (!advancedProduct) return;
    await posApi.createVariant(advancedProduct.id, {
      name: variantForm.name,
      sku: variantForm.sku,
      barcode: variantForm.barcode || null,
      price: variantForm.price ? Number(variantForm.price) : null,
      stockOnHand: Number(variantForm.stockOnHand || 0),
    });
    setVariantForm({ name: '', sku: '', barcode: '', price: '', stockOnHand: '0' });
    openAdvanced(advancedProduct);
  };

  const saveModifier = async () => {
    if (!advancedProduct) return;
    await posApi.createModifierGroup(advancedProduct.id, {
      name: modifierForm.name,
      minSelect: 0,
      maxSelect: 1,
      options: [{ name: modifierForm.optionName, priceDelta: Number(modifierForm.priceDelta || 0) }],
    });
    setModifierForm({ name: '', optionName: '', priceDelta: '0' });
    openAdvanced(advancedProduct);
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Products</h1>
          <p className="adm-page-subtitle">
            {loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setShowAdd(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <NavLink
          to="/products"
          className={({ isActive }) => `adm-btn adm-btn--sm ${isActive ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
        >
          Products
        </NavLink>
        <NavLink
          to="/products/categories"
          className={({ isActive }) => `adm-btn adm-btn--sm ${isActive ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
        >
          Categories
        </NavLink>
      </div>

      <div className="adm-toolbar" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div className="adm-search-wrap" style={{ maxWidth: 420 }}>
          <svg className="adm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="adm-search"
            placeholder="Search by name / SKU / barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="adm-input" style={{ width: 220 }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
          Include inactive
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
          Low stock
        </label>
      </div>

      {error && (
        <div className="adm-alert adm-alert--error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {!loading && products.length === 0 ? (
        <div className="adm-card" style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {search || categoryId || includeInactive || lowStock
              ? 'No products match your filters.'
              : 'No products yet. Add your first product for POS.'}
          </p>
          {!search && !categoryId && !includeInactive && !lowStock && (
            <button className="adm-btn adm-btn--primary" style={{ marginTop: 14 }} onClick={() => setShowAdd(true)}>
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const price = toNumber(p.price);
                const categoryName = p.category?.name || (p.categoryId ? categoryNameById.get(p.categoryId) : null);
                const low = p.trackInventory && p.stockOnHand <= (p.reorderLevel ?? 0);

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.imageUrl ? (
                          <img 
                            src={p.imageUrl} 
                            alt={p.name} 
                            style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }} 
                          />
                        ) : (
                          <div style={{ 
                            width: 42, 
                            height: 42, 
                            borderRadius: 8, 
                            backgroundColor: 'var(--n-50)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'var(--n-300)',
                            border: '1px solid var(--border)'
                          }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                          {p.unit ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.unit}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>{p.sku}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {p.barcode || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{categoryName || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800 }}>
                      {price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {p.trackInventory ? (
                        <span className={`adm-badge ${low ? 'adm-badge--maroon' : 'adm-badge--gray'}`}>
                          {p.stockOnHand}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`adm-badge ${p.isActive ? 'adm-badge--success' : 'adm-badge--gray'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(p)}>
                          Edit
                        </button>
                        <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openAdvanced(p)}>
                          Variants
                        </button>
                        <button
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={async () => {
                            if (!confirm(`Delete product "${p.name}"?`)) return;
                            try {
                              await productsApi.delete(p.id);
                              fetchAll();
                            } catch (err: any) {
                              alert(err.message || 'Failed to delete product.');
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddProductModal
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            fetchAll();
          }}
        />
      )}
      {editing && (
        <EditProductModal
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            fetchAll();
          }}
        />
      )}
      {advancedProduct && (
        <div className="adm-modal-overlay">
          <div className="adm-modal" style={{ maxWidth: 860 }}>
            <div className="adm-modal-header">
              <div>
                <p className="adm-modal-title">Variants & Modifiers</p>
                <p className="adm-modal-subtitle">{advancedProduct.name}</p>
              </div>
              <button className="adm-modal-close" onClick={() => setAdvancedProduct(null)}>x</button>
            </div>
            <div className="adm-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <h3 style={{ marginTop: 0 }}>Variants</h3>
                <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                  <input className="adm-input" placeholder="Variant name" value={variantForm.name} onChange={(e) => setVariantForm((f) => ({ ...f, name: e.target.value }))} />
                  <input className="adm-input" placeholder="SKU" value={variantForm.sku} onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))} />
                  <input className="adm-input" placeholder="Barcode" value={variantForm.barcode} onChange={(e) => setVariantForm((f) => ({ ...f, barcode: e.target.value }))} />
                  <input className="adm-input" placeholder="Price override" value={variantForm.price} onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))} />
                  <input className="adm-input" placeholder="Stock" value={variantForm.stockOnHand} onChange={(e) => setVariantForm((f) => ({ ...f, stockOnHand: e.target.value }))} />
                  <button className="adm-btn adm-btn--primary" onClick={saveVariant}>Add Variant</button>
                </div>
                {variants.map((v) => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid var(--border)' }}>
                    <strong>{v.name}</strong><span>{v.sku} / stock {v.stockOnHand}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 style={{ marginTop: 0 }}>Modifiers</h3>
                <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                  <input className="adm-input" placeholder="Group name, e.g. Size" value={modifierForm.name} onChange={(e) => setModifierForm((f) => ({ ...f, name: e.target.value }))} />
                  <input className="adm-input" placeholder="Option name, e.g. Large" value={modifierForm.optionName} onChange={(e) => setModifierForm((f) => ({ ...f, optionName: e.target.value }))} />
                  <input className="adm-input" placeholder="Price delta" value={modifierForm.priceDelta} onChange={(e) => setModifierForm((f) => ({ ...f, priceDelta: e.target.value }))} />
                  <button className="adm-btn adm-btn--primary" onClick={saveModifier}>Add Modifier</button>
                </div>
                {modifierGroups.map((g) => (
                  <div key={g.id} style={{ padding: 8, borderBottom: '1px solid var(--border)' }}>
                    <strong>{g.name}</strong>
                    <div style={{ color: 'var(--text-secondary)' }}>{(g.options || []).map((o: any) => `${o.name} (${Number(o.priceDelta) >= 0 ? '+' : ''}${Number(o.priceDelta)})`).join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

