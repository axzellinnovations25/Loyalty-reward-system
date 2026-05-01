import { useEffect, useRef, useState } from 'react';
import { productsApi } from '../../../api/products';
import type { ProductCategory } from '../../../types';

export default function EditCategoryModal({
  category,
  onClose,
  onSuccess,
}: {
  category: ProductCategory;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || '');
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await productsApi.updateCategory(category.id, { name: name.trim(), description: description.trim() || '' });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update category.');
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
      <div className="adm-modal adm-modal--sm">
        <div className="adm-modal-header">
          <div>
            <p className="adm-modal-title">Edit Category</p>
            <p className="adm-modal-subtitle">{category.name}</p>
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

            <div className="adm-form-group">
              <label className="adm-label" htmlFor="edit-cat-name">
                Name <span className="adm-label-required">*</span>
              </label>
              <input
                id="edit-cat-name"
                ref={nameRef}
                className="adm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label" htmlFor="edit-cat-desc">Description</label>
              <input
                id="edit-cat-desc"
                className="adm-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
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

