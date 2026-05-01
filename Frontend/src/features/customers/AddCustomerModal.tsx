import React, { useState, useRef, useEffect } from 'react';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';

interface AddCustomerModalProps {
  onClose: () => void;
  onSuccess: (customer: Customer, redirect?: boolean) => void;
}

export default function AddCustomerModal({ onClose, onSuccess }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'save' | 'save_and_purchase'>('save');
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) { setError('Name is required.'); return; }
    if (digits.length !== 9 || digits[0] !== '7') {
      setError('Please enter a valid 9-digit mobile number starting with 7 (e.g. 7XXXXXXXX).');
      return;
    }
    const fullPhone = '+94' + digits;
    setLoading(true);
    setError(null);
    try {
      const res = await customersApi.create({ name: name.trim(), phone: fullPhone });
      const customer = (res as any).data ?? res;
      onSuccess(customer, actionType === 'save_and_purchase');
    } catch (err: any) {
      setError(err.message || 'Failed to register customer.');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--a-400), var(--a-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <div>
              <p className="adm-modal-title">Register New Customer</p>
              <p className="adm-modal-subtitle">Enter details to create a member profile.</p>
            </div>
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
              <label className="adm-label" htmlFor="add-customer-name">
                Full Name <span className="adm-label-required">*</span>
              </label>
              <input
                id="add-customer-name"
                ref={nameRef}
                type="text"
                className="adm-input"
                placeholder="e.g. Priyantha Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="adm-form-group">
              <label className="adm-label" htmlFor="add-customer-phone">
                Mobile Number <span className="adm-label-required">*</span>
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
                  id="add-customer-phone"
                  type="text"
                  placeholder="771234567"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.startsWith('0')) val = val.slice(1);
                    if (val.startsWith('94')) val = val.slice(2);
                    setPhone(val.slice(0, 9));
                  }}
                  style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: '0.875rem', color: 'var(--text-primary)', fontFamily: 'var(--font)' }}
                  required
                />
              </div>
              <p className="adm-hint">9 digits after +94, starting with 7</p>
            </div>
          </div>

          {/* Footer */}
          <div className="adm-modal-footer" style={{ flexDirection: 'column', gap: 8 }}>
            <button
              id="add-customer-submit"
              type="submit"
              className="adm-btn adm-btn--primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setActionType('save')}
              disabled={loading}
            >
              {loading && actionType === 'save'
                ? <><span className="adm-spinner" style={{ marginRight: 6 }} />Processing…</>
                : 'Confirm Registration'}
            </button>
            <button
              id="add-customer-purchase"
              type="submit"
              className="adm-btn adm-btn--ghost"
              style={{ width: '100%', justifyContent: 'center', color: 'var(--a-600)', borderColor: 'var(--a-100)' }}
              onClick={() => setActionType('save_and_purchase')}
              disabled={loading}
            >
              {loading && actionType === 'save_and_purchase'
                ? <><span className="adm-spinner adm-spinner--dark" style={{ marginRight: 6 }} />Processing…</>
                : 'Register & Record Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
