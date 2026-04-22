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
    
    // Check if phone was changed. If it was, validate it.
    if (phone) {
      if (digits.length !== 9 || digits[0] !== '7') {
        setError('Please enter a valid 9-digit mobile number starting with 7 (e.g. 7XXXXXXXX).');
        return;
      }
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
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '20px'
      }}
    >
      <div style={{
        width: '100%', maxWidth: '420px', background: '#fff',
        borderRadius: '12px', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.12)'
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Edit Customer</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>Update name or phone number.</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priyantha Silva"
              required
              style={{
                width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1',
                borderRadius: '6px', fontSize: '0.9rem', color: '#1e293b',
                outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Phone Number</label>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '0 12px', background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', borderRight: '1px solid #cbd5e1', flexShrink: 0 }}>
                +94
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.startsWith('0')) val = val.slice(1);
                  if (val.startsWith('94')) val = val.slice(2);
                  setPhone(val.slice(0, 9));
                }}
                placeholder="771234567"
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '0.9rem', color: '#1e293b' }}
              />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>Enter the 9 digits after +94 (starts with 7).</p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="shop-btn shop-btn--ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="shop-btn shop-btn--primary" style={{ flex: 1 }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
