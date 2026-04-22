import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '../../api/settings';
import type { ShopSettings, UpdateShopSettingsRequest } from '../../types';
import './settings-page.css';

/* ── helpers ─────────────────────────────────────────────────── */
type Toast = { msg: string; type: 'success' | 'error' } | null;

/** Parse a field to a number only if valid, else undefined. */
function toNum(v: string): number | undefined {
  const x = Number(v);
  return v.trim() === '' || isNaN(x) ? undefined : x;
}

/** Live preview helper – show '–' when field is blank. */
function previewNum(v: string, fallback = '–'): string {
  const x = Number(v);
  return v.trim() === '' || isNaN(x) ? fallback : x.toLocaleString();
}

/* ═══════════════════════════════════════════════════════════════ */
export default function SettingsPage() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState<Toast>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  /* ── form state – all start empty until loaded from API ───── */
  const [pointsPerAmount,    setPointsPerAmount]    = useState('');
  const [redemptionValue,    setRedemptionValue]    = useState('');
  const [minRedeemPoints,    setMinRedeemPoints]    = useState('');
  const [maxRedeemMode,      setMaxRedeemMode]      = useState<'flat_amount' | 'percent_of_bill'>('flat_amount');
  const [maxRedeemValue,     setMaxRedeemValue]     = useState('');
  const [redemptionMode,     setRedemptionMode]     = useState<'partial' | 'full_only'>('partial');
  const [pointsExpiryMonths, setPointsExpiryMonths] = useState('');
  const [expiryWarningDays,  setExpiryWarningDays]  = useState('');
  const [smsEnabled,         setSmsEnabled]         = useState(false);
  const [textlkSenderId,     setTextlkSenderId]     = useState('');
  const [textlkApiKey,       setTextlkApiKey]       = useState('');
  const [textlkApiUrl,       setTextlkApiUrl]       = useState('');

  /* ── Load saved settings once ───────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await settingsApi.get();
      const s: ShopSettings = (raw as any).data ?? raw;

      /* Only populate if the value actually exists in the response */
      if (s.pointsPerAmount     != null) setPointsPerAmount(String(s.pointsPerAmount));
      if (s.redemptionValue     != null) setRedemptionValue(String(s.redemptionValue));
      if (s.minRedeemPoints     != null) setMinRedeemPoints(String(s.minRedeemPoints));
      if (s.maxRedeemMode       != null) setMaxRedeemMode(s.maxRedeemMode);
      if (s.maxRedeemValue      != null) setMaxRedeemValue(String(s.maxRedeemValue));
      if (s.redemptionMode      != null) setRedemptionMode(s.redemptionMode);
      if (s.pointsExpiryMonths  != null) setPointsExpiryMonths(String(s.pointsExpiryMonths));
      if (s.expiryWarningDays   != null) setExpiryWarningDays(String(s.expiryWarningDays));
      if (s.smsEnabled          != null) setSmsEnabled(s.smsEnabled);
      if (s.textlkSenderId      != null) setTextlkSenderId(s.textlkSenderId);
      if (s.textlkApiUrl        != null) setTextlkApiUrl(s.textlkApiUrl);
      setHasApiKey(s.hasApiKey ?? false);
    } catch {
      /* No settings saved yet — fields remain blank. That is expected. */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Save ────────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    try {
      const payload: UpdateShopSettingsRequest = {};

      if (toNum(pointsPerAmount)    !== undefined) payload.pointsPerAmount    = toNum(pointsPerAmount)!;
      if (toNum(redemptionValue)    !== undefined) payload.redemptionValue    = toNum(redemptionValue)!;
      if (toNum(minRedeemPoints)    !== undefined) payload.minRedeemPoints    = toNum(minRedeemPoints)!;
      if (toNum(pointsExpiryMonths) !== undefined) payload.pointsExpiryMonths = toNum(pointsExpiryMonths)!;
      if (toNum(expiryWarningDays)  !== undefined) payload.expiryWarningDays  = toNum(expiryWarningDays)!;

      payload.maxRedeemMode  = maxRedeemMode;
      payload.redemptionMode = redemptionMode;
      payload.smsEnabled     = smsEnabled;

      /* Max redeem value: send null to clear, number to set */
      payload.maxRedeemValue = maxRedeemValue.trim() !== ''
        ? toNum(maxRedeemValue) ?? null
        : null;

      /* SMS fields — only when SMS is enabled */
      if (smsEnabled) {
        if (textlkSenderId.trim()) payload.textlkSenderId = textlkSenderId.trim();
        if (textlkApiUrl.trim())   payload.textlkApiUrl   = textlkApiUrl.trim();
        if (textlkApiKey.trim())   payload.textlkApiKey   = textlkApiKey.trim();
      }

      if (Object.keys(payload).length === 0) {
        setToast({ msg: 'Nothing to save — fill in at least one field.', type: 'error' });
        return;
      }

      await settingsApi.update(payload);

      if (textlkApiKey.trim()) { setHasApiKey(true); setTextlkApiKey(''); }
      setToast({ msg: 'Settings saved successfully!', type: 'success' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings.';
      setToast({ msg, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3200);
    }
  };

  /* ── Live preview (shows '–' when field is blank) ────────── */
  const previewEarn   = pointsPerAmount.trim()
    ? `Rs. ${previewNum(pointsPerAmount)} = 1 pt`
    : '–';
  const previewRedeem = redemptionValue.trim()
    ? (maxRedeemMode === 'flat_amount' 
        ? `${previewNum(redemptionValue)} pts = Rs. 1 off` 
        : `${previewNum(redemptionValue)} pts = 1% off`)
    : '–';
  const previewMin    = minRedeemPoints.trim()
    ? (Number(minRedeemPoints) === 0 ? 'No minimum' : `${previewNum(minRedeemPoints)} pts min`)
    : '–';
  const previewExpiry = pointsExpiryMonths.trim()
    ? (Number(pointsExpiryMonths) === 0 ? 'Never expire' : `${pointsExpiryMonths} months`)
    : '–';

  /* ── Render ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="settings-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #ede5e8', borderTopColor: '#a80028', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="settings-page">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="settings-header">
        <div>
          <h1 className="settings-header-title">Shop Settings</h1>
          <p className="settings-header-sub">Configure how your loyalty programme works</p>
        </div>
        <button
          id="settings-save-btn"
          className="shop-btn shop-btn--primary"
          style={{ padding: '10px 22px', fontWeight: 700, fontSize: '0.875rem' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? <><span className="settings-spinner" /> Saving…</>
            : <><SaveIcon /> Save Changes</>}
        </button>
      </div>

      <div className="settings-body">

        {/* ── Live Preview Banner ──────────────────────────── */}
        <div className="settings-preview" role="status" aria-label="Current settings summary">
          <div className="settings-preview-item">
            <div className="settings-preview-label">Earn Rate</div>
            <div className="settings-preview-value">{previewEarn}</div>
          </div>
          <div className="settings-preview-item">
            <div className="settings-preview-label">Redeem Value</div>
            <div className="settings-preview-value">{previewRedeem}</div>
          </div>
          <div className="settings-preview-item">
            <div className="settings-preview-label">Min Redeem</div>
            <div className="settings-preview-value">{previewMin}</div>
          </div>
          <div className="settings-preview-item">
            <div className="settings-preview-label">Points Expiry</div>
            <div className="settings-preview-value">{previewExpiry}</div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 1 — Discount Method
        ════════════════════════════════════════════════════ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon"><RedeemIcon /></div>
            <div>
              <h2 className="settings-card-title">Discount Method</h2>
              <p className="settings-card-desc">Choose how you want to reward your customers</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="settings-field-full">
              <label className="settings-label">Discount Method</label>
              <div className="settings-segmented" role="group" aria-label="Discount method">
                <button
                  id="max-mode-flat"
                  type="button"
                  className={`settings-seg-btn${maxRedeemMode === 'flat_amount' ? ' active' : ''}`}
                  onClick={() => setMaxRedeemMode('flat_amount')}
                >
                  Flat Amount (Rs.)
                </button>
                <button
                  id="max-mode-percent"
                  type="button"
                  className={`settings-seg-btn${maxRedeemMode === 'percent_of_bill' ? ' active' : ''}`}
                  onClick={() => setMaxRedeemMode('percent_of_bill')}
                >
                  Percentage of Bill (%)
                </button>
              </div>
              <span className="settings-hint">
                {maxRedeemMode === 'flat_amount'
                  ? 'Customers earn points that convert into a fixed rupee amount discount.'
                  : 'Customers earn points that convert into a percentage discount off their total bill.'}
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 2 — Points Earn & Redeem Rates
        ════════════════════════════════════════════════════ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon"><CoinIcon /></div>
            <div>
              <h2 className="settings-card-title">Earn & Redeem Rates</h2>
              <p className="settings-card-desc">Set how customers earn and spend their points</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="settings-field">

              <div>
                <label className="settings-label" htmlFor="points-per-amount">
                  Amount per Point (Rs.)
                </label>
                <div className="settings-input-prefix">
                  <span>Rs.</span>
                  <input
                    id="points-per-amount"
                    type="number"
                    min="1"
                    step="1"
                    className="settings-input"
                    value={pointsPerAmount}
                    onChange={e => setPointsPerAmount(e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
                <span className="settings-hint">Spend Rs. X to earn 1 point</span>
              </div>

              <div>
                <label className="settings-label" htmlFor="redemption-value">
                  Redemption Value {maxRedeemMode === 'flat_amount' ? '(pts → Rs. 1 off)' : '(pts → 1% off)'}
                </label>
                <div className="settings-input-suffix">
                  <span>{maxRedeemMode === 'flat_amount' ? 'pts = Rs. 1' : 'pts = 1%'}</span>
                  <input
                    id="redemption-value"
                    type="number"
                    min="1"
                    step="1"
                    className="settings-input"
                    value={redemptionValue}
                    onChange={e => setRedemptionValue(e.target.value)}
                    placeholder={maxRedeemMode === 'flat_amount' ? "e.g. 500" : "e.g. 100"}
                  />
                </div>
                <span className="settings-hint">
                  {maxRedeemMode === 'flat_amount' ? 'X pts = Rs. 1 off the bill' : 'X pts = 1% off the bill'}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 3 — Redemption Limits
        ════════════════════════════════════════════════════ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon"><RedeemIcon /></div>
            <div>
              <h2 className="settings-card-title">Redemption Limits</h2>
              <p className="settings-card-desc">Control limitations and modes for redemptions</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="settings-field">

              <div>
                <label className="settings-label" htmlFor="min-redeem-points">
                  Min Redemption (points)
                </label>
                <div className="settings-input-suffix">
                  <span>pts</span>
                  <input
                    id="min-redeem-points"
                    type="number"
                    min="0"
                    step="1"
                    className="settings-input"
                    value={minRedeemPoints}
                    onChange={e => setMinRedeemPoints(e.target.value)}
                    placeholder="e.g. 50  (0 = none)"
                  />
                </div>
                <span className="settings-hint">Leave 0 or blank for no minimum</span>
              </div>

              <div>
                <label className="settings-label" htmlFor="max-redeem-value">
                  Max Redemption Limit
                </label>
                <div className="settings-input-prefix">
                  <span>{maxRedeemMode === 'percent_of_bill' ? '%' : 'Rs.'}</span>
                  <input
                    id="max-redeem-value"
                    type="number"
                    min="0"
                    step="any"
                    className="settings-input"
                    value={maxRedeemValue}
                    onChange={e => setMaxRedeemValue(e.target.value)}
                    placeholder="Leave blank for no limit"
                  />
                </div>
                <span className="settings-hint">Optional upper bound per transaction</span>
              </div>

            </div>

            <div className="settings-field">

              <div className="settings-field-full">
                <label className="settings-label">Redemption Mode</label>
                <div className="settings-segmented" role="group" aria-label="Redemption mode">
                  <button
                    id="redeem-mode-partial"
                    type="button"
                    className={`settings-seg-btn${redemptionMode === 'partial' ? ' active' : ''}`}
                    onClick={() => setRedemptionMode('partial')}
                  >
                    Partial
                  </button>
                  <button
                    id="redeem-mode-full"
                    type="button"
                    className={`settings-seg-btn${redemptionMode === 'full_only' ? ' active' : ''}`}
                    onClick={() => setRedemptionMode('full_only')}
                  >
                    Full Balance Only
                  </button>
                </div>
                <span className="settings-hint">
                  {redemptionMode === 'partial'
                    ? 'Customer may redeem any portion of their balance'
                    : 'Customer must redeem their entire balance at once'}
                </span>
              </div>

            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 3 — Points Expiry
        ════════════════════════════════════════════════════ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon"><ClockIcon /></div>
            <div>
              <h2 className="settings-card-title">Points Expiry</h2>
              <p className="settings-card-desc">Expire points after a period of customer inactivity</p>
            </div>
          </div>
          <div className="settings-card-body">
            <div className="settings-field">

              <div>
                <label className="settings-label" htmlFor="points-expiry-months">
                  Expire After Inactivity
                </label>
                <div className="settings-input-suffix">
                  <span>months</span>
                  <input
                    id="points-expiry-months"
                    type="number"
                    min="0"
                    step="1"
                    className="settings-input"
                    value={pointsExpiryMonths}
                    onChange={e => setPointsExpiryMonths(e.target.value)}
                    placeholder="e.g. 6  (0 = never)"
                  />
                </div>
                <span className="settings-hint">0 = points never expire</span>
              </div>

              <div>
                <label className="settings-label" htmlFor="expiry-warning-days">
                  Expiry Warning Lead
                </label>
                <div className="settings-input-suffix">
                  <span>days</span>
                  <input
                    id="expiry-warning-days"
                    type="number"
                    min="0"
                    step="1"
                    className="settings-input"
                    value={expiryWarningDays}
                    onChange={e => setExpiryWarningDays(e.target.value)}
                    placeholder="e.g. 14"
                  />
                </div>
                <span className="settings-hint">Notify customer this many days before expiry</span>
              </div>

            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            CARD 4 — SMS Notifications
        ════════════════════════════════════════════════════ */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon"><SmsIcon /></div>
            <div>
              <h2 className="settings-card-title">SMS Notifications</h2>
              <p className="settings-card-desc">Send automated messages on earn, redeem and expiry events</p>
            </div>
          </div>
          <div className="settings-card-body">

            {/* Toggle */}
            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <h4>Enable SMS</h4>
                <p>Send automated SMS messages for transactions and expiry warnings</p>
              </div>
              <label className="settings-toggle" htmlFor="sms-enabled">
                <input
                  id="sms-enabled"
                  type="checkbox"
                  checked={smsEnabled}
                  onChange={e => setSmsEnabled(e.target.checked)}
                />
                <span className="settings-toggle-slider" />
              </label>
            </div>

            {/* SMS credentials — visible only when SMS is enabled */}
            {smsEnabled && (
              <div className="settings-field">

                <div>
                  <label className="settings-label" htmlFor="sms-sender-id">
                    Sender ID
                  </label>
                  <input
                    id="sms-sender-id"
                    type="text"
                    maxLength={11}
                    className="settings-input"
                    value={textlkSenderId}
                    onChange={e => setTextlkSenderId(e.target.value)}
                    placeholder="e.g. MYSHOP"
                  />
                  <span className="settings-hint">3–11 characters (text.lk sender name)</span>
                </div>

                <div>
                  <label className="settings-label" htmlFor="sms-api-url">
                    API URL
                  </label>
                  <input
                    id="sms-api-url"
                    type="url"
                    className="settings-input"
                    value={textlkApiUrl}
                    onChange={e => setTextlkApiUrl(e.target.value)}
                    placeholder="https://api.text.lk/..."
                  />
                  <span className="settings-hint">text.lk gateway endpoint</span>
                </div>

                <div className="settings-field-full">
                  <label className="settings-label" htmlFor="sms-api-key">
                    API Key
                    {hasApiKey
                      ? <span className="api-key-set-badge">✓ Key saved</span>
                      : <span className="api-key-not-set-badge">Not configured</span>}
                  </label>
                  <input
                    id="sms-api-key"
                    type="password"
                    className="settings-input"
                    value={textlkApiKey}
                    onChange={e => setTextlkApiKey(e.target.value)}
                    placeholder={hasApiKey ? '•••••••• (leave blank to keep existing)' : 'Enter API key…'}
                    autoComplete="new-password"
                  />
                  <span className="settings-hint">Stored encrypted. Leave blank to keep the existing key.</span>
                </div>

              </div>
            )}

          </div>

          {/* Bottom save bar */}
          <div className="settings-save-bar">
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Changes apply to all future transactions
            </span>
            <button
              className="shop-btn shop-btn--primary"
              style={{ padding: '9px 20px', fontWeight: 700 }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving
                ? <><span className="settings-spinner" /> Saving…</>
                : <><SaveIcon /> Save</>}
            </button>
          </div>
        </div>

      </div>{/* /settings-body */}

      {/* ── Toast notification ──────────────────────────────── */}
      {toast && (
        <div className={`settings-toast${toast.type === 'error' ? ' settings-toast--error' : ''}`}>
          {toast.type === 'success' ? <CheckIcon /> : <AlertIcon />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Inline SVG icons ─────────────────────────────────────────── */
function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2M9 12h6" />
    </svg>
  );
}
function RedeemIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V22H4V12" />
      <path d="M22 7H2v5h20V7z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function SmsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function SaveIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
