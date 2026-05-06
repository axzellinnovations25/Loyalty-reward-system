import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { giftCardsApi } from '../../api/giftCards';
import type { GiftCard } from '../../types';
import CreateGiftCardModal from './CreateGiftCardModal';

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { active: 'adm-badge--green', used: 'adm-badge--gray', expired: 'adm-badge--red' };
  return <span className={`adm-badge ${map[status] ?? 'adm-badge--gray'}`}>{status}</span>;
}

/* ─── View Modal ──────────────────────────────────────────── */
function ViewGiftCardModal({ id, onClose }: { id: string; onClose: () => void }) {
  const [card, setCard] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await giftCardsApi.get(id);
        setCard((res as any).data ?? res);
      } catch (err: any) {
        setError(err.message || 'Failed to load card');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="adm-modal-overlay" onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="adm-modal adm-modal--sm">
        <div className="adm-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--a-400), var(--a-700))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <p className="adm-modal-title">Gift Card Details</p>
              <p className="adm-modal-subtitle">Full card info and QR code</p>
            </div>
          </div>
          <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="adm-modal-body" style={{ textAlign: 'center' }}>
          {loading ? (
            <div style={{ padding: '40px 0' }}>
              <span className="adm-spinner adm-spinner--dark" style={{ width: 32, height: 32, marginBottom: 12 }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading…</p>
            </div>
          ) : error ? (
            <div className="adm-alert adm-alert--error">{error}</div>
          ) : card ? (
            <>
              {/* Card art */}
              <div style={{ background: 'linear-gradient(135deg, #a80028 0%, #7a001a 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, marginBottom: 6 }}>Gift Card</div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900 }}>{formatCurrency(Number(card.value))}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: 4, fontWeight: 700, marginTop: 12, opacity: 0.9 }}>{card.code}</div>
                </div>
                <StatusBadge status={card.status} />
              </div>

              {/* QR Code */}
              {card.qrCodeImage && (
                <div style={{ background: '#fff', padding: 12, display: 'inline-block', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 24 }}>
                  <img src={card.qrCodeImage} alt="Gift Card QR" style={{ width: 180, height: 180, display: 'block' }} />
                </div>
              )}

              {/* Details grid */}
              <div style={{ background: 'var(--n-50)', borderRadius: 12, border: '1px solid var(--border)', padding: '16px 20px', textAlign: 'left', display: 'grid', gap: 12 }}>
                {[
                  { label: 'Status', value: <StatusBadge status={card.status} /> },
                  { label: 'Value', value: formatCurrency(Number(card.value)) },
                  { label: 'Created', value: formatDate(card.createdAt) },
                  { label: 'Expiry', value: card.expiryDate ? formatDate(card.expiryDate) : 'No expiry' },
                  { label: 'Used On', value: card.usedAt ? formatDate(card.usedAt) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.87rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="adm-modal-footer">
          <button type="button" className="adm-btn adm-btn--primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ────────────────────────────────── */
function DeleteConfirmModal({ card, onConfirm, onCancel, loading }: { card: GiftCard; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="adm-modal-overlay" onClick={(e) => { if (e.currentTarget === e.target) onCancel(); }}>
      <div className="adm-modal adm-modal--sm">
        <div className="adm-modal-header">
          <p className="adm-modal-title">Delete Gift Card</p>
          <button type="button" className="adm-modal-close" onClick={onCancel} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-alert adm-alert--error" style={{ marginBottom: 16 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            This action cannot be undone.
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Are you sure you want to delete gift card <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{card.code}</strong> worth <strong>{formatCurrency(Number(card.value))}</strong>?
          </p>
        </div>
        <div className="adm-modal-footer">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="button" className="adm-btn adm-btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="adm-spinner" style={{ marginRight: 6 }} />Deleting…</> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Download helper ────────────────────────────────────── */
async function downloadGiftCard(card: GiftCard) {
  // Fetch full card details (includes qrCodeImage)
  let qrSrc = (card as any).qrCodeImage as string | undefined;
  if (!qrSrc) {
    try {
      const res = await giftCardsApi.get(card.id);
      const data = (res as any).data ?? res;
      qrSrc = data.qrCodeImage;
    } catch {
      alert('Failed to load QR code for download.');
      return;
    }
  }

  const W = 700, H = 380;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#a80028');
  grad.addColorStop(1, '#4a0012');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 24);
  ctx.fill();

  // Decorative circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(W - 80, -60, 180, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-40, H + 40, 160, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Brand label
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = 'bold 13px Inter, Arial, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('GIFT CARD', 48, 56);

  // Value
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 58px Inter, Arial, sans-serif';
  ctx.fillText(`Rs. ${Number(card.value).toFixed(2)}`, 48, 140);

  // Code
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(card.code, 48, 200);

  // Expiry
  const expiryText = card.expiryDate
    ? `Valid until: ${new Date(card.expiryDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`
    : 'No expiry date';
  ctx.font = '500 15px Inter, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(expiryText, 48, H - 38);

  // Chip/logo accent
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.roundRect(48, 230, 52, 38, 6); ctx.fill();

  // QR Code
  const qrImg = new Image();
  qrImg.src = qrSrc!;
  await new Promise<void>((resolve) => { qrImg.onload = () => resolve(); qrImg.onerror = () => resolve(); });
  const QR = 150;
  const qrX = W - QR - 48, qrY = (H - QR) / 2;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.roundRect(qrX - 10, qrY - 10, QR + 20, QR + 20, 12); ctx.fill();
  ctx.drawImage(qrImg, qrX, qrY, QR, QR);

  // Download
  const link = document.createElement('a');
  link.download = `gift-card-${card.code}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function GiftCardListPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingCard, setDeletingCard] = useState<GiftCard | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredCards = cards.filter(c => filterStatus === 'all' || c.status === filterStatus);

  const fetchCards = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await giftCardsApi.list();
      const payload = (response as any).data ?? response;
      const items = payload.items ?? (Array.isArray(payload) ? payload : []);
      setCards(items);
    } catch (error) {
      console.error('Failed to fetch gift cards:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const handleDelete = async () => {
    if (!deletingCard) return;
    setDeleteLoading(true);
    try {
      await giftCardsApi.delete(deletingCard.id);
      setDeletingCard(null);
      fetchCards();
    } catch (err: any) {
      alert(err.message || 'Failed to delete gift card.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="adm-page">
      {/* View Modal */}
      {viewingId && <ViewGiftCardModal id={viewingId} onClose={() => setViewingId(null)} />}

      {/* Delete Confirm Modal */}
      {deletingCard && (
        <DeleteConfirmModal
          card={deletingCard}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCard(null)}
          loading={deleteLoading}
        />
      )}

      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Gift Cards</h1>
          <p className="adm-page-subtitle">Manage gift cards, issue new ones, and view their status.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="adm-btn adm-btn--ghost" onClick={() => navigate('/gift-cards/scan')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><rect x="7" y="7" width="3" height="3" /><rect x="14" y="7" width="3" height="3" /><rect x="7" y="14" width="3" height="3" /><rect x="14" y="14" width="3" height="3" />
            </svg>
            Scan / Redeem
          </button>
          <button className="adm-btn adm-btn--primary" onClick={() => setIsCreateModalOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Gift Card
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Active', count: cards.filter(c => c.status === 'active').length, color: 'var(--success)' },
          { label: 'Total Used', count: cards.filter(c => c.status === 'used').length, color: 'var(--text-primary)' },
          { label: 'Total Expired', count: cards.filter(c => c.status === 'expired').length, color: 'var(--error)' },
        ].map(({ label, count, color }) => (
          <div key={label} className="adm-card" style={{ flex: 1, padding: 20, minWidth: 200 }}>
            <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', background: 'var(--n-100)', padding: 4, borderRadius: 8 }}>
          {['all', 'active', 'used', 'expired'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{ padding: '6px 16px', border: 'none', background: filterStatus === status ? '#fff' : 'transparent', color: filterStatus === status ? 'var(--text-primary)' : 'var(--text-secondary)', borderRadius: 6, fontSize: '0.85rem', fontWeight: filterStatus === status ? 700 : 600, cursor: 'pointer', textTransform: 'capitalize', boxShadow: filterStatus === status ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading && cards.length === 0 ? (
        <div className="adm-card">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div className="adm-skeleton" style={{ width: 100, height: 16 }} />
              <div style={{ flex: 1 }}><div className="adm-skeleton" style={{ width: '20%', height: 14 }} /></div>
              <div className="adm-skeleton" style={{ width: 80, height: 26, borderRadius: 20 }} />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p className="adm-empty-title">No gift cards yet</p>
            <p className="adm-empty-desc">Create your first gift card to issue to customers.</p>
            <button className="adm-btn adm-btn--primary" style={{ marginTop: 16 }} onClick={() => setIsCreateModalOpen(true)}>Create Gift Card</button>
          </div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty" style={{ padding: '40px 0' }}>
            <p className="adm-empty-title" style={{ fontSize: '1.1rem' }}>No {filterStatus} gift cards found.</p>
            <button className="adm-btn adm-btn--ghost" style={{ marginTop: 12 }} onClick={() => setFilterStatus('all')}>Clear Filter</button>
          </div>
        </div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Value</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Created</th>
                <th style={{ textAlign: 'center' }}>Expiry</th>
                <th style={{ textAlign: 'center' }}>Used On</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => (
                <tr key={card.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{card.code}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{formatCurrency(Number(card.value))}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}><StatusBadge status={card.status} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(card.createdAt)}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: card.expiryDate ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {card.expiryDate ? formatDate(card.expiryDate) : 'No expiry'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{card.usedAt ? formatDate(card.usedAt) : '—'}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      {/* View */}
                      <button
                        type="button"
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        title="View details"
                        onClick={() => setViewingId(card.id)}
                        style={{ padding: '5px 10px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </button>
                      {/* Download */}
                      <button
                        type="button"
                        className="adm-btn adm-btn--ghost adm-btn--sm"
                        title="Download gift card image"
                        disabled={downloadingId === card.id}
                        onClick={async () => {
                          setDownloadingId(card.id);
                          await downloadGiftCard(card);
                          setDownloadingId(null);
                        }}
                        style={{ padding: '5px 10px' }}
                      >
                        {downloadingId === card.id ? (
                          <span className="adm-spinner" style={{ width: 12, height: 12 }} />
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        )}
                        Download
                      </button>
                      {/* Delete — only for non-used cards */}
                      {card.status !== 'used' && (
                        <button
                          type="button"
                          className="adm-btn adm-btn--danger adm-btn--sm"
                          title="Delete card"
                          onClick={() => setDeletingCard(card)}
                          style={{ padding: '5px 10px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateGiftCardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { setIsCreateModalOpen(false); fetchCards(); }}
      />
    </div>
  );
}
