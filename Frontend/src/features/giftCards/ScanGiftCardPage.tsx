import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { giftCardsApi } from '../../api/giftCards';
import type { GiftCard } from '../../types';

const formatCurrency = (amount: number) => `Rs. ${Number(amount).toFixed(2)}`;

// ─── QR Scanner sub-component ───────────────────────────────────────────────
type PermState = 'checking' | 'requesting' | 'denied' | 'scanning';

function QrScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false);
  const idRef = useRef(`qr-${Date.now()}`);
  const [permState, setPermState] = useState<PermState>('checking');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Initialize scanner whenever permState becomes 'scanning' ────────────────
  useEffect(() => {
    if (permState !== 'scanning') return;
    if (!containerRef.current) return;

    // Set stable ID on the container
    containerRef.current.id = idRef.current;

    // Tear down any previous instance first
    const prev = scannerRef.current;
    if (prev) {
      try { prev.stop().catch(() => {}); } catch { /* ignore */ }
    }

    const scanner = new Html5Qrcode(idRef.current);
    scannerRef.current = scanner;
    detectedRef.current = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (decoded) => {
          if (detectedRef.current) return;
          detectedRef.current = true;
          scanner.stop().catch(() => {}).finally(() => onDetected(decoded));
        },
        () => {}
      )
      .catch((err: any) => {
        const msg = String(err?.message ?? err ?? '').toLowerCase();
        const isDenied = msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed');
        setPermState('denied');
        setErrorMsg(isDenied
          ? 'Camera permission was denied by the browser.'
          : 'Camera is unavailable or may be in use by another app.');
      });

    return () => {
      try { scanner.stop().catch(() => {}); } catch { /* ignore */ }
    };
  }, [permState, onDetected]);

  // ── Check permission on first mount ─────────────────────────────────────────
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermState('denied');
      setErrorMsg('Camera is not supported in this browser.');
      return;
    }
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((result) => {
          if (result.state === 'denied') {
            setPermState('denied');
            setErrorMsg('Camera permission was denied. Please allow it in your browser settings.');
          } else {
            setPermState('scanning');
          }
        })
        .catch(() => setPermState('scanning'));
    } else {
      setPermState('scanning');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Request permission button handler ────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    setPermState('requesting');
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      // Setting to 'scanning' triggers the scanner useEffect above
      setPermState('scanning');
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? '').toLowerCase();
      setPermState('denied');
      setErrorMsg(
        msg.includes('denied') || msg.includes('dismissed')
          ? 'Permission denied. Please allow camera access in your browser settings.'
          : 'Could not access camera. It may be in use by another app.'
      );
    }
  }, []);

  const showPermUI = permState === 'checking' || permState === 'requesting' || permState === 'denied';
  const isRequesting = permState === 'requesting' || permState === 'checking';

  return (
    <>
      {/* ── Permission / denied UI (hidden when scanning) ── */}
      <div style={{ display: showPermUI ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'linear-gradient(160deg, #1a1a2e 0%, #0d0d1a 100%)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: '36px 28px', textAlign: 'center' }}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #1a1a2e' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>

        <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px' }}>Camera Access Required</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 6px', lineHeight: 1.5 }}>
          {errorMsg || 'This browser needs camera permission to scan QR codes.'}
        </p>
        {permState === 'denied' && errorMsg.includes('settings') && (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', margin: '0 0 4px', lineHeight: 1.5 }}>
            Click the 🔒 lock icon in your address bar → Site settings → Camera → Allow
          </p>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            type="button"
            disabled={isRequesting}
            onClick={requestPermission}
            style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: isRequesting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #a80028, #6d0018)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: isRequesting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {isRequesting ? (
              <>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Requesting…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
                Request Camera Access
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Scanner view — container ALWAYS in DOM so ref is never null ── */}
      <div style={{ display: permState === 'scanning' ? 'block' : 'none', position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: '#000' }}>
        <style>{`
          #${idRef.current} video { width:100%!important; height:100%!important; object-fit:cover!important; display:block!important; }
          #${idRef.current} img { display:none!important; }
          #${idRef.current} > div { padding:0!important; border:none!important; }
        `}</style>
        <div style={{ width: '100%', height: 300, position: 'relative', overflow: 'hidden' }}>
          <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </div>
        {/* Corner guides */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position:'absolute', top:24, left:24, width:36, height:36, borderTop:'3px solid #fff', borderLeft:'3px solid #fff', borderRadius:'4px 0 0 0', opacity:0.8 }} />
          <div style={{ position:'absolute', top:24, right:24, width:36, height:36, borderTop:'3px solid #fff', borderRight:'3px solid #fff', borderRadius:'0 4px 0 0', opacity:0.8 }} />
          <div style={{ position:'absolute', bottom:24, left:24, width:36, height:36, borderBottom:'3px solid #fff', borderLeft:'3px solid #fff', borderRadius:'0 0 0 4px', opacity:0.8 }} />
          <div style={{ position:'absolute', bottom:24, right:24, width:36, height:36, borderBottom:'3px solid #fff', borderRight:'3px solid #fff', borderRadius:'0 0 4px 0', opacity:0.8 }} />
        </div>
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
          <span style={{ background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600 }}>
            Position QR Code inside the frame
          </span>
        </div>
      </div>
    </>
  );
}


// ─── Result views ────────────────────────────────────────────────────────────
function SuccessView({ card, onReset }: { card: GiftCard | null; onReset: () => void }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#dcfce7', color: '#16a34a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>Card Redeemed!</h2>
      {card && (
        <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>
          Code: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{card.code}</span>
        </p>
      )}
      {card && (
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          Value: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(card.value))}</strong>
        </p>
      )}
      <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
        The card has been marked as used in the system.
      </p>
      <button className="adm-btn adm-btn--primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onReset}>
        Redeem Another Card
      </button>
    </div>
  );
}

function ErrorView({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div style={{ padding: '32px 0', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#fee2e2', color: '#dc2626',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Card Rejected</h2>
      <div style={{
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 10, padding: '14px 18px',
        color: '#b91c1c', fontSize: '0.9rem',
        textAlign: 'left', marginBottom: 28,
      }}>
        {message}
      </div>
      <button className="adm-btn adm-btn--ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onReset}>
        Try Again
      </button>
    </div>
  );
}

function LoadingView() {
  return (
    <div style={{ padding: '64px 0', textAlign: 'center' }}>
      <span className="adm-spinner adm-spinner--dark" style={{ width: 36, height: 36, marginBottom: 20 }} />
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Validating &amp; Redeeming…</h3>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type Mode = 'qr' | 'manual';
type Stage = 'input' | 'loading' | 'success' | 'error';

export default function ScanGiftCardPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('qr');
  const [stage, setStage] = useState<Stage>('input');
  const [manualCode, setManualCode] = useState('');
  const [card, setCard] = useState<GiftCard | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  // Key is used to force-remount the QrScanner when user resets
  const [scannerKey, setScannerKey] = useState(0);

  const processCode = useCallback(async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    setStage('loading');
    setCard(null);
    setErrorMsg('');

    try {
      const response = await giftCardsApi.validate(code);
      const data = (response as any).data ?? response;
      setCard(data);

      await giftCardsApi.redeem({ code });
      setStage('success');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid card code or redemption failed.');
      setStage('error');
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCode(manualCode);
  };

  const handleReset = () => {
    setStage('input');
    setManualCode('');
    setCard(null);
    setErrorMsg('');
    setScannerKey(k => k + 1); // remount QrScanner fresh
  };

  const handleModeChange = (next: Mode) => {
    // Reset input state but keep stage as 'input'
    setManualCode('');
    setMode(next);
    setScannerKey(k => k + 1);
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
            ← Back to Gift Cards
          </button>
          <h1 className="adm-page-title">Redeem Gift Card</h1>
          <p className="adm-page-subtitle">
            Scan a QR code or enter the card code to validate and redeem it instantly.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="adm-card" style={{ padding: 32 }}>

          {/* ── Stage: result screens ── */}
          {stage === 'loading' && <LoadingView />}
          {stage === 'success' && <SuccessView card={card} onReset={handleReset} />}
          {stage === 'error' && <ErrorView message={errorMsg} onReset={handleReset} />}

          {/* ── Stage: input ── */}
          {stage === 'input' && (
            <>
              {/* Mode toggle */}
              <div style={{
                display: 'flex',
                background: 'var(--n-100, #f1f5f9)',
                borderRadius: 12,
                padding: 5,
                marginBottom: 28,
                gap: 4,
              }}>
                {(['qr', 'manual'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleModeChange(m)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: 9,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: mode === m ? 700 : 500,
                      fontSize: '0.9rem',
                      background: mode === m ? '#fff' : 'transparent',
                      color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {m === 'qr' ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                          <line x1="14" y1="14" x2="14" y2="14" /><line x1="17" y1="14" x2="17" y2="14" /><line x1="20" y1="14" x2="20" y2="14" />
                          <line x1="14" y1="17" x2="14" y2="17" /><line x1="17" y1="17" x2="20" y2="20" /><line x1="20" y1="17" x2="20" y2="17" />
                        </svg>
                        Scan QR Code
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Enter Code
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* QR mode */}
              {mode === 'qr' && (
                <QrScanner key={scannerKey} onDetected={processCode} />
              )}

              {/* Manual mode */}
              {mode === 'manual' && (
                <div style={{ textAlign: 'center', paddingTop: 8 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--a-50, #fdf2f8)',
                    color: 'var(--a-600, #9d174d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                    Enter Gift Card Code
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
                    Type the code printed or shown on the gift card.
                  </p>
                  <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      type="text"
                      className="adm-input"
                      placeholder="e.g. A3F9B2E1"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      autoFocus
                      style={{
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        fontSize: '1.4rem',
                        padding: '14px 16px',
                        textAlign: 'center',
                        letterSpacing: 4,
                        width: '100%',
                      }}
                    />
                    <button
                      type="submit"
                      className="adm-btn adm-btn--primary"
                      disabled={!manualCode.trim()}
                      style={{ width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: '1rem' }}
                    >
                      Validate &amp; Redeem
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
