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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) { setError('Name is required.'); return; }
    
    // Validate that we have exactly 9 digits and the first digit is 7
    if (digits.length !== 9 || digits[0] !== '7') { 
      setError('Please enter a valid 9-digit mobile number starting with 7 (e.g. 7XXXXXXXX).'); 
      return; 
    }
    
    const fullPhone = '+94' + digits;

    setLoading(true);
    setError(null);

    try {
      const res = await customersApi.create({ name: name.trim(), phone: fullPhone });
      // Backend returns: { success: true, data: { id, name, phone, ... } }
      const customer = (res as any).data ?? res;
      onSuccess(customer, actionType === 'save_and_purchase');
    } catch (err: any) {
      setError(err.message || 'Failed to register customer.');
    } finally {
      setLoading(false);
    }
  };


  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div 
      ref={overlayRef} 
      onClick={handleOverlayClick}
      style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        padding: '20px'
      }}
    >
      <div style={{ 
        width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: '#a80028', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Register New Customer</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Enter details below to create member profile.</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{ 
              marginBottom: '20px', padding: '10px 12px', borderRadius: '6px', 
              backgroundColor: '#fff1f2', border: '1px solid #ffe4e6', color: '#be123c',
              fontSize: '0.8rem', fontWeight: 600, display: 'flex', gap: '8px'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Membership Name</label>
            <input
              ref={nameRef}
              type="text"
              placeholder="e.g. Priyantha Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1',
                fontSize: '0.9rem', color: '#1e293b', boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>Mobile Communication</label>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ padding: '0 12px', background: '#f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', borderRight: '1px solid #cbd5e1' }}>+94</div>
              <input
                type="text"
                placeholder="771234567"
                value={phone}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '');
                  if (val.startsWith('0')) val = val.slice(1);
                  if (val.startsWith('94')) val = val.slice(2);
                  setPhone(val.slice(0, 9));
                }}
                style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: '1rem', color: '#1e293b' }}
                required
              />
            </div>
            <p style={{ marginTop: '6px', fontSize: '0.7rem', color: '#94a3b8' }}>
              Enter the 9 digits after +94 (should start with 7).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              type="submit" 
              onClick={() => setActionType('save')}
              disabled={loading}
              className="shop-btn shop-btn--primary"
              style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '0.9rem' }}
            >
              {loading && actionType === 'save' ? 'Processing...' : 'Confirm Registration'}
            </button>
            <button 
              type="submit" 
              onClick={() => setActionType('save_and_purchase')}
              disabled={loading}
              className="shop-btn shop-btn--ghost"
              style={{ width: '100%', padding: '12px', borderRadius: '6px', fontSize: '0.9rem', color: '#a80028', borderColor: '#ffe4e6' }}
            >
              {loading && actionType === 'save_and_purchase' ? 'Processing...' : 'Register & Record Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
