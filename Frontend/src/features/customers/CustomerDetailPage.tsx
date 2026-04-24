import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import type { Customer } from '../../types';
import EditCustomerModal from './EditCustomerModal';
import { purchasesApi } from '../../api/purchases';
import { redemptionsApi } from '../../api/redemptions';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'purchases' | 'redemptions'>('purchases');
  const [showEditModal, setShowEditModal] = useState(false);
  const [voiding, setVoiding] = useState<string | null>(null);

  const fetchCustomer = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await customersApi.get(id);
      const data = ((res as { data?: Customer }).data || res) as Customer;
      setCustomer(data);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleVoidPurchase = async (purchaseId: string) => {
    if (!window.confirm('Are you sure you want to void this purchase? This action cannot be undone.')) return;
    setVoiding(purchaseId);
    try {
      await purchasesApi.void(purchaseId);
      await fetchCustomer();
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || 'Failed to void purchase.');
    } finally {
      setVoiding(null);
    }
  };

  const handleVoidRedemption = async (redemptionId: string) => {
    if (!window.confirm('Are you sure you want to void this redemption? This action cannot be undone.')) return;
    setVoiding(redemptionId);
    try {
      await redemptionsApi.void(redemptionId);
      await fetchCustomer();
    } catch (err: unknown) {
      const e = err as Error;
      alert(e.message || 'Failed to void redemption.');
    } finally {
      setVoiding(null);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #f1f5f9', borderTopColor: '#a80028', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>Fetching Member Profile...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>👤</div>
        <h2 style={{ color: '#1e293b', fontWeight: 900, marginBottom: '8px' }}>Member Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '400px' }}>{error || 'The requested customer profile could not be located in your directory.'}</p>
        <button className="adm-btn adm-btn--primary" onClick={() => navigate('/customers')}>
          Back to Directory
        </button>
      </div>
    );
  }

  const purchases = customer.purchases || [];
  const redemptions = customer.redemptions || [];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Header */}
      <header style={{ 
        background: '#fff', padding: '16px 32px', borderBottom: '1px solid #e2e8f0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/customers')} 
            style={{ 
              background: '#f1f5f9', border: 'none', color: '#64748b', 
              width: '40px', height: '40px', borderRadius: '10px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>{customer.name}</h1>
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: '#a80028', background: '#fdf2f4', padding: '1px 6px', borderRadius: '4px' }}>MEMBER</span> • 
              <span>Registered {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button 
             className="adm-btn adm-btn--ghost" 
             onClick={() => setShowEditModal(true)}
             style={{ padding: '10px 16px' }}
           >
             Edit Profile
           </button>
           <button 
             className="adm-btn adm-btn--primary"
             onClick={() => navigate(`/purchases/new?customerId=${customer.id}`)}
             style={{ padding: '10px 16px' }}
           >
             Record Purchase
           </button>
        </div>
      </header>

      <div style={{ padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px' }}>
          
          {/* Main Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* History Tabs Card */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <button 
                  onClick={() => setActiveTab('purchases')}
                  style={{
                    padding: '16px 24px', border: 'none', background: activeTab === 'purchases' ? '#fff' : 'none',
                    color: activeTab === 'purchases' ? '#a80028' : '#64748b',
                    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                    borderBottom: activeTab === 'purchases' ? '2px solid #a80028' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  Purchase History ({purchases.length})
                </button>
                <button 
                  onClick={() => setActiveTab('redemptions')}
                  style={{
                    padding: '16px 24px', border: 'none', background: activeTab === 'redemptions' ? '#fff' : 'none',
                    color: activeTab === 'redemptions' ? '#a80028' : '#64748b',
                    fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                    borderBottom: activeTab === 'redemptions' ? '2px solid #a80028' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  Redemption Logs ({redemptions.length})
                </button>
              </div>

              <div style={{ minHeight: '400px' }}>
                {activeTab === 'purchases' ? (
                  <div style={{ padding: '0' }}>
                    {purchases.length === 0 ? (
                      <div style={{ padding: '80px 40px', textAlign: 'center', color: '#94a3b8' }}>
                         <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛍️</div>
                         <p style={{ fontWeight: 600 }}>No purchases recorded yet.</p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Date & ID</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Points Earned</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc', background: p.isVoided ? '#fef2f2' : 'none' }}>
                               <td style={{ padding: '16px 24px' }}>
                                 <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                                   {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                 </div>
                                 <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>#{p.id.slice(0, 8).toUpperCase()}</div>
                               </td>
                               <td style={{ padding: '16px 24px', fontWeight: 800, color: '#1e293b' }}>
                                 Rs. {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                               </td>
                               <td style={{ padding: '16px 24px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 800 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                                    +{p.pointsEarned} PTS
                                 </div>
                               </td>
                               <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                  {p.isVoided ? (
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>VOIDED</span>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>COMPLETED</span>
                                      <button 
                                        disabled={voiding === p.id}
                                        onClick={() => handleVoidPurchase(p.id)}
                                        style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: voiding === p.id ? 'not-allowed' : 'pointer' }}
                                      >
                                        {voiding === p.id ? '...' : 'Void'}
                                      </button>
                                    </div>
                                  )}
                               </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '0' }}>
                    {redemptions.length === 0 ? (
                      <div style={{ padding: '80px 40px', textAlign: 'center', color: '#94a3b8' }}>
                         <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎁</div>
                         <p style={{ fontWeight: 600 }}>No points claimed yet.</p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Date</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Points Used</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Benefit Used</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redemptions.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid #f8fafc', background: r.isVoided ? '#fef2f2' : 'none' }}>
                               <td style={{ padding: '16px 24px' }}>
                                 <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                                   {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                 </div>
                               </td>
                               <td style={{ padding: '16px 24px' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontWeight: 800 }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                                    -{r.pointsRedeemed} PTS
                                 </div>
                               </td>
                               <td style={{ padding: '16px 24px', fontWeight: 800, color: '#1e293b' }}>
                                 Rs. {Number(r.discountValue).toLocaleString(undefined, { minimumFractionDigits: 2 })} Discount
                               </td>
                               <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                  {r.isVoided ? (
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>VOIDED</span>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563eb', background: '#dbeafe', padding: '4px 8px', borderRadius: '4px' }}>REDEEMED</span>
                                      <button 
                                        disabled={voiding === r.id}
                                        onClick={() => handleVoidRedemption(r.id)}
                                        style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: voiding === r.id ? 'not-allowed' : 'pointer' }}
                                      >
                                        {voiding === r.id ? '...' : 'Void'}
                                      </button>
                                    </div>
                                  )}
                               </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Points Summary Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #a80028 0%, #7c001d 100%)', 
              borderRadius: '20px', padding: '32px', color: '#fff', 
              boxShadow: '0 12px 24px -6px rgba(168, 0, 40, 0.3)',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1 }}>
                 <svg width="140" height="140" viewBox="0 0 24 24" fill="white"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Remaining Balance</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '3rem', fontWeight: 900 }}>{customer.totalPoints.toLocaleString()}</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, opacity: 0.8 }}>PTS</span>
              </div>
              <div style={{ marginTop: '24px', height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px' }}>
                 <div style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: '3px' }} />
              </div>
              <p style={{ marginTop: '12px', fontSize: '0.7rem', fontWeight: 600, opacity: 0.7 }}>Points available for instant redemption.</p>
            </div>

            {/* Quick Info List */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
               <h3 style={{ margin: '0 0 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Member Information</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{customer.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Last Transaction</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: customer.lastActivityAt ? '#1e293b' : '#94a3b8' }}>
                      {customer.lastActivityAt ? new Date(customer.lastActivityAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No history'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Total Savings</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#16a34a' }}>
                      Rs. {redemptions.reduce((acc, r) => acc + Number(r.discountValue), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
               </div>
            </div>

          </div>

        </div>
      </div>

      {showEditModal && (
        <EditCustomerModal
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchCustomer();
          }}
        />
      )}
    </div>
  );
}

