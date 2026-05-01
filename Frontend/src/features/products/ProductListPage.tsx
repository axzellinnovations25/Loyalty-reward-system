import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { productsApi } from '../../api/products';
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
    </div>
  );
}

