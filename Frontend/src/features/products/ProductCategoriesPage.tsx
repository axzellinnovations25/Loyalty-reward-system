import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { productsApi } from '../../api/products';
import type { ProductCategory } from '../../types';
import AddCategoryModal from './modals/AddCategoryModal';
import EditCategoryModal from './modals/EditCategoryModal';

export default function ProductCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<ProductCategory | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.listCategories();
      const payload = (res as any).data ?? res;
      setCategories(Array.isArray(payload) ? payload : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Product Categories</h1>
          <p className="adm-page-subtitle">
            {loading ? 'Loading…' : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`}
          </p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setShowAdd(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Category
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

      <div className="adm-toolbar">
        <div className="adm-search-wrap" style={{ maxWidth: 420 }}>
          <svg className="adm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="adm-search"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setSearch('')}>
            Clear
          </button>
        )}
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

      {!loading && filtered.length === 0 ? (
        <div className="adm-card" style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {search ? 'No categories match your search.' : 'No categories yet. Create your first category.'}
          </p>
          {!search && (
            <button className="adm-btn adm-btn--primary" style={{ marginTop: 14 }} onClick={() => setShowAdd(true)}>
              Add First Category
            </button>
          )}
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 520 }}>
                    {c.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setEditing(c)}>
                        Edit
                      </button>
                      <button
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        style={{ color: 'var(--danger)' }}
                        onClick={async () => {
                          if (!confirm(`Delete category "${c.name}"?`)) return;
                          try {
                            await productsApi.deleteCategory(c.id);
                            fetchCategories();
                          } catch (err: any) {
                            alert(err.message || 'Failed to delete category.');
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddCategoryModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            fetchCategories();
          }}
        />
      )}
      {editing && (
        <EditCategoryModal
          category={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => {
            setEditing(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}
