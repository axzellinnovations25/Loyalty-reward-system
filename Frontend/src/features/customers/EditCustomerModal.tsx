import React, { useState, useRef, useEffect } from 'react';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCustomerModal({ customer, onClose, onSuccess }: EditCustomerModalProps) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone.replace(/^\+94/, ''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (phone && (digits.length !== 9 || digits[0] !== '7')) {
      setError('Please enter a valid 9-digit mobile number starting with 7.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await customersApi.update(customer.id, {
        name: name.trim(),
        phone: phone ? '+94' + digits : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update customer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="adm-modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="adm-modal adm-modal--sm">
        {/* Header */}
        <div className="adm-modal-header">
          <div>
            <p className="adm-modal-title">Edit Customer</p>
            <p className="adm-modal-subtitle">Update name or phone number.</p>
          </div>
          <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="adm-modal-body">
            {error && (
              <div className="adm-alert adm-alert--error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <div className="adm-form-group">
              <label className="adm-label" htmlFor="edit-customer-name">
                Full Name <span className="adm-label-required">*</span>
              </label>
              <input
                id="edit-customer-name"
                type="text"
                className="adm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priyantha Silva"
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label" htmlFor="edit-customer-phone">
                Phone Number
              </label>
              <div style={{
                display: 'flex', border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)', overflow: 'hidden',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
                onFocusCapture={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--a-400)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(168,0,40,0.1)';
                }}
                onBlurCapture={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{
                  padding: '0 12px', background: 'var(--n-50)', color: 'var(--text-secondary)',
                  fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center',
                  borderRight: '1px solid var(--border)', flexShrink: 0,
                }}>+94</div>
                <input
                  id="edit-customer-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('0')) val = val.slice(1);
                    if (val.startsWith('94')) val = val.slice(2);
                    setPhone(val.slice(0, 9));
                  }}
                  placeholder="771234567"
                  style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}
                />
              </div>
              <p className="adm-hint">9 digits after +94, starting with 7</p>
            </div>
          </div>

          {/* Footer */}
          <div className="adm-modal-footer">
            <button
              id="edit-customer-cancel"
              type="button"
              className="adm-btn adm-btn--ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              id="edit-customer-submit"
              type="submit"
              className="adm-btn adm-btn--primary"
              disabled={loading}
            >
              {loading
                ? <><span className="adm-spinner" style={{ marginRight: 6 }} />Saving…</>
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
