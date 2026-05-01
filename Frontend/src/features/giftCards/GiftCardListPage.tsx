import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { giftCardsApi } from '../../api/giftCards';
import type { GiftCard } from '../../types';
import CreateGiftCardModal from './CreateGiftCardModal';

const formatCurrency = (amount: number) => `Rs. ${amount.toFixed(2)}`;

export default function GiftCardListPage() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredCards = cards.filter(c => filterStatus === 'all' || c.status === filterStatus);

  const fetchCards = async () => {
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
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="adm-badge adm-badge--green">Active</span>;
      case 'used':
        return <span className="adm-badge adm-badge--gray">Used</span>;
      case 'expired':
        return <span className="adm-badge adm-badge--red">Expired</span>;
      default:
        return <span className="adm-badge adm-badge--gray">{status}</span>;
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Gift Cards</h1>
          <p className="adm-page-subtitle">
            Manage gift cards, issue new ones, and view their status.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="adm-btn adm-btn--ghost"
            onClick={() => navigate('/gift-cards/scan')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="14" y="7" width="3" height="3" />
              <rect x="7" y="14" width="3" height="3" />
              <rect x="14" y="14" width="3" height="3" />
            </svg>
            Scan QR
          </button>
          <button
            className="adm-btn adm-btn--primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Gift Card
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="adm-card" style={{ flex: 1, padding: 20, minWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>Total Active</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--success)' }}>
            {cards.filter(c => c.status === 'active').length}
          </div>
        </div>
        <div className="adm-card" style={{ flex: 1, padding: 20, minWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>Total Used</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {cards.filter(c => c.status === 'used').length}
          </div>
        </div>
        <div className="adm-card" style={{ flex: 1, padding: 20, minWidth: 200 }}>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>Total Expired</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--error)' }}>
            {cards.filter(c => c.status === 'expired').length}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', background: 'var(--n-100)', padding: 4, borderRadius: 8 }}>
          {['all', 'active', 'used', 'expired'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: '6px 16px',
                border: 'none',
                background: filterStatus === status ? '#fff' : 'transparent',
                color: filterStatus === status ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderRadius: 6,
                fontSize: '0.85rem',
                fontWeight: filterStatus === status ? 700 : 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
                boxShadow: filterStatus === status ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {isLoading && cards.length === 0 ? (
        <div className="adm-card">
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
              <div className="adm-skeleton" style={{ width: 100, height: 16 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="adm-skeleton" style={{ width: '20%', height: 14 }} />
              </div>
              <div className="adm-skeleton" style={{ width: 80, height: 26, borderRadius: 20 }} />
            </div>
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="adm-card">
          <div className="adm-empty">
            <div className="adm-empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <p className="adm-empty-title">No gift cards yet</p>
            <p className="adm-empty-desc">Create your first gift card to issue to customers.</p>
            <button
              className="adm-btn adm-btn--primary"
              style={{ marginTop: 16 }}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create Gift Card
            </button>
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
                <th style={{ textAlign: 'center' }}>Created Date</th>
                <th style={{ textAlign: 'center' }}>Expiry Date</th>
                <th style={{ textAlign: 'center' }}>Used Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card) => (
                <tr key={card.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {card.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {formatCurrency(Number(card.value))}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(card.status)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(card.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {card.expiryDate ? (
                       <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                         {new Date(card.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No expiry</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {card.usedAt ? (
                       <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                         {new Date(card.usedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>-</span>
                    )}
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
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchCards();
        }}
      />
    </div>
  );
}
