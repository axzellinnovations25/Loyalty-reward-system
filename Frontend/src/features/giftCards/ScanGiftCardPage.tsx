import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { giftCardsApi } from '../../api/giftCards';
import type { GiftCard } from '../../types';

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

export default function ScanGiftCardPage() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [validationLoading, setValidationLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [card, setCard] = useState<GiftCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);

  useEffect(() => {
    // Only start scanner if we are not showing a result/error/success
    if (scanResult || success || card || error) {
      if (scannerRef.current && isScanning.current) {
        scannerRef.current.stop().then(() => {
          isScanning.current = false;
        }).catch(console.error);
      }
      return;
    }

    const startScanner = async () => {
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode('qr-reader');
        }
        
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            if (!isScanning.current) return;
            setScanResult(decodedText);
            isScanning.current = false;
            scannerRef.current?.stop().catch(console.error);
          },
          () => {} // ignore frame errors
        );
        isScanning.current = true;
        setCameraError(null);
      } catch (err: any) {
        console.error(err);
        setCameraError('Camera access denied or unavailable. Please use manual entry.');
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && isScanning.current) {
        scannerRef.current.stop().then(() => {
          isScanning.current = false;
        }).catch(console.error);
      }
    };
  }, [scanResult, success, card, error]);

  useEffect(() => {
    if (scanResult) {
      validateCode(scanResult);
    }
  }, [scanResult]);

  const validateCode = useCallback(async (code: string) => {
    setValidationLoading(true);
    setError(null);
    setCard(null);
    setSuccess(false);
    try {
      console.log('Validating code:', code);
      const response = await giftCardsApi.validate(code);
      const data = (response as any).data ?? response;
      console.log('Validation response:', data);
      setCard(data);
    } catch (err: any) {
      console.error('Validation error:', err);
      setError(err.message || 'Invalid card code');
    } finally {
      setValidationLoading(false);
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim().toUpperCase();
    if (code) {
      console.log('Manual submit:', code);
      setScanResult(code);
    }
  };

  const handleRedeem = async () => {
    if (!scanResult) return;
    setRedeemLoading(true);
    try {
      await giftCardsApi.redeem({ code: scanResult });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to redeem gift card');
    } finally {
      setRedeemLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualCode('');
    setCard(null);
    setError(null);
    setSuccess(false);
    setCameraError(null);
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <button 
            className="adm-btn adm-btn--ghost" 
            style={{ marginBottom: 12, paddingLeft: 0, color: 'var(--text-secondary)' }}
            onClick={() => navigate('/gift-cards')}
          >
            &larr; Back to Gift Cards
          </button>
          <h1 className="adm-page-title">Scan Gift Card</h1>
          <p className="adm-page-subtitle">
            Scan a customer's gift card QR code to validate and redeem it.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {!scanResult && !success && !card && !error ? (
          <div className="adm-card" style={{ padding: 32 }}>
            <div style={{ position: 'relative', width: '100%', marginBottom: 24, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: '#000', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cameraError ? (
                <div style={{ color: '#fff', textAlign: 'center', padding: 24 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, marginBottom: 16 }}>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <line x1="2" y1="2" x2="22" y2="22"></line>
                  </svg>
                  <p style={{ margin: 0, opacity: 0.8 }}>{cameraError}</p>
                </div>
              ) : (
                <>
                  <div id="qr-reader" style={{ width: '100%', height: '100%', border: 'none' }}></div>
                  <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                    <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>Position QR Code inside the frame</span>
                  </div>
                </>
              )}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 24, position: 'relative' }}>
              <div style={{ borderTop: '1px solid var(--border)', position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 1 }}></div>
              <span style={{ background: '#fff', padding: '0 16px', color: 'var(--text-muted)', fontSize: '0.85rem', position: 'relative', zIndex: 2 }}>OR ENTER MANUALLY</span>
            </div>

            <form onSubmit={handleManualSubmit} style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <input 
                type="text" 
                className="adm-input" 
                placeholder="Enter card code..." 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{ flex: 1, fontFamily: 'monospace', textTransform: 'uppercase' }}
              />
              <button type="submit" className="adm-btn adm-btn--primary" disabled={!manualCode.trim()}>
                Validate
              </button>
            </form>
          </div>
        ) : (
          <div className="adm-card" style={{ padding: 40, textAlign: 'center' }}>
            {validationLoading || (!card && !error && !success) ? (
              <div style={{ padding: '40px 0' }}>
                <span className="adm-spinner adm-spinner--dark" style={{ width: 32, height: 32, marginBottom: 16 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Validating...</h3>
              </div>
            ) : success ? (
              <div className="adm-fade" style={{ padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--success-light)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Card Redeemed!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>The value has been applied and the card is marked as used.</p>
                <button className="adm-btn adm-btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={resetScanner}>
                  Scan Another Card
                </button>
              </div>
            ) : error ? (
              <div className="adm-fade" style={{ padding: '20px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--error-light)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>Card Rejected</h2>
                <div className="adm-alert adm-alert--error" style={{ textAlign: 'left', marginBottom: 32 }}>
                  {error}
                </div>
                <button className="adm-btn adm-btn--ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={resetScanner}>
                  Try Again
                </button>
              </div>
            ) : card ? (
              <div className="adm-fade" style={{ padding: '10px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--a-50)', color: 'var(--a-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Valid Gift Card</h2>
                <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: 2, color: 'var(--text-secondary)', marginBottom: 24 }}>
                  {card.code}
                </div>
                
                <div style={{ background: 'var(--n-50)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>Card Value</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--a-600)' }}>
                    {formatCurrency(Number(card.value))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="adm-btn adm-btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={resetScanner} disabled={redeemLoading}>
                    Cancel
                  </button>
                  <button className="adm-btn adm-btn--primary" style={{ flex: 2, justifyContent: 'center' }} onClick={handleRedeem} disabled={redeemLoading}>
                    {redeemLoading ? <><span className="adm-spinner" style={{ marginRight: 8 }} />Redeeming...</> : 'Confirm Redemption'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
