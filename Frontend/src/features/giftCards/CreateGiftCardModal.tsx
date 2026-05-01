import { useState, useRef, useEffect } from 'react';
import { giftCardsApi } from '../../api/giftCards';
import type { GiftCard } from '../../types';

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

interface CreateGiftCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateGiftCardModal({ isOpen, onClose, onSuccess }: CreateGiftCardModalProps) {
  const [value, setValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdCard, setCreatedCard] = useState<GiftCard | null>(null);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => valueRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const response = await giftCardsApi.create({
        value: Number(value),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      });
      setCreatedCard((response as any).data ?? response);
    } catch (err: any) {
      setError(err.message || 'Failed to create gift card. Check limits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (!createdCard) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Gift Card</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
              body { 
                font-family: 'Inter', sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background: #f8fafc; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .voucher { 
                width: 600px;
                background: #fff; 
                border-radius: 24px; 
                box-shadow: 0 20px 40px rgba(0,0,0,0.08); 
                overflow: hidden;
                display: flex;
                border: 1px solid #e2e8f0;
                position: relative;
              }
              .voucher-left {
                background: linear-gradient(135deg, #a80028 0%, #7a001a 100%);
                color: white;
                padding: 40px;
                width: 40%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                position: relative;
              }
              .voucher-left::after {
                content: '';
                position: absolute;
                right: -10px;
                top: 0;
                bottom: 0;
                width: 20px;
                background-image: radial-gradient(circle at 10px, transparent 10px, #fff 11px);
                background-size: 20px 24px;
                background-position: 0 0;
              }
              .brand {
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 4px;
                opacity: 0.8;
                margin-bottom: 8px;
                font-weight: 600;
              }
              .title { 
                font-size: 28px; 
                font-weight: 900; 
                margin-bottom: 24px;
                line-height: 1.1;
                text-align: center;
              }
              .value-box {
                background: rgba(255,255,255,0.1);
                padding: 16px 24px;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.2);
              }
              .value { 
                font-size: 32px; 
                font-weight: 900; 
              }
              .voucher-right {
                padding: 40px;
                width: 60%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #fff;
              }
              .qr-container {
                background: #fff;
                padding: 12px;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                border: 1px solid #f1f5f9;
                margin-bottom: 20px;
              }
              .qr-code { width: 160px; height: 160px; display: block; }
              .code-label {
                font-size: 11px;
                text-transform: uppercase;
                color: #94a3b8;
                letter-spacing: 1px;
                margin-bottom: 4px;
                font-weight: 600;
              }
              .code { 
                font-family: monospace; 
                font-size: 24px; 
                letter-spacing: 4px; 
                color: #0f172a; 
                font-weight: 800;
                margin-bottom: 16px;
              }
              .expiry { 
                font-size: 13px; 
                color: #64748b; 
                background: #f1f5f9;
                padding: 6px 12px;
                border-radius: 20px;
                font-weight: 600;
              }
              @media print {
                body { background: white; }
                .voucher { box-shadow: none; border: 2px dashed #cbd5e1; }
                .voucher-left { background: #a80028 !important; }
              }
            </style>
          </head>
          <body>
            <div class="voucher">
              <div class="voucher-left">
                <div class="brand">PREMIUM</div>
                <div class="title">GIFT<br/>CARD</div>
                <div class="value-box">
                  <div class="value">${formatCurrency(Number(createdCard.value))}</div>
                </div>
              </div>
              <div class="voucher-right">
                ${createdCard.qrCodeImage ? `
                <div class="qr-container">
                  <img src="${createdCard.qrCodeImage}" class="qr-code" alt="QR Code" />
                </div>` : ''}
                <div class="code-label">Card Code</div>
                <div class="code">${createdCard.code}</div>
                ${createdCard.expiryDate ? `<div class="expiry">Valid until: ${new Date(createdCard.expiryDate).toLocaleDateString()}</div>` : '<div class="expiry">No Expiry Date</div>'}
              </div>
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => window.close(), 500);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleClose = () => {
    if (createdCard) {
      onSuccess();
    }
    setCreatedCard(null);
    setValue('');
    setExpiryDate('');
    setError('');
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="adm-modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) handleClose(); }}
    >
      <div className="adm-modal adm-modal--sm">
        <div className="adm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--a-400), var(--a-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <p className="adm-modal-title">{createdCard ? 'Gift Card Created' : 'Create Gift Card'}</p>
              <p className="adm-modal-subtitle">{createdCard ? 'Card is ready to be printed or shared.' : 'Generate a new card with a specific value.'}</p>
            </div>
          </div>
          <button type="button" className="adm-modal-close" onClick={handleClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!createdCard ? (
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
                <label className="adm-label" htmlFor="gc-value">
                  Value (Rs.) <span className="adm-label-required">*</span>
                </label>
                <input
                  id="gc-value"
                  ref={valueRef}
                  type="number"
                  min="1"
                  step="0.01"
                  className="adm-input"
                  placeholder="e.g. 5000"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-label" htmlFor="gc-expiry">
                  Expiry Date
                </label>
                <input
                  id="gc-expiry"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="adm-input"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                <p className="adm-hint">Leave blank if the card never expires.</p>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                type="button"
                className="adm-btn adm-btn--ghost"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="adm-btn adm-btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? <><span className="adm-spinner" style={{ marginRight: 6 }} />Creating…</> : 'Generate Card'}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="adm-modal-body" style={{ textAlign: 'center', paddingTop: 24 }}>
              <div style={{ background: 'var(--n-50)', padding: 24, borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--a-600)', marginBottom: 16 }}>
                  {formatCurrency(Number(createdCard.value))}
                </div>
                {createdCard.qrCodeImage && (
                  <div style={{ background: '#fff', padding: 8, display: 'inline-block', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 16 }}>
                    <img 
                      src={createdCard.qrCodeImage} 
                      alt="Gift Card QR Code" 
                      style={{ width: 160, height: 160, display: 'block' }}
                    />
                  </div>
                )}
                <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: 3, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {createdCard.code}
                </div>
                {createdCard.expiryDate && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                    Valid until: {new Date(createdCard.expiryDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="adm-modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="adm-btn adm-btn--ghost"
                onClick={handleClose}
              >
                Close
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--primary"
                onClick={handlePrint}
              >
                Print Card
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
