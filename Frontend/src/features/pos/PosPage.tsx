import { useState, useEffect, useCallback, useMemo } from 'react';
import { productsApi } from '../../api/products';
import { customersApi } from '../../api/customers';
import { purchasesApi } from '../../api/purchases';
import type { Product, ProductCategory, Customer } from '../../types';
import './pos.css';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearching, setIsCustomerSearching] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list({ limit: 100 }),
        productsApi.listCategories()
      ]);
      
      const prodPayload = (prodRes as any).data ?? prodRes;
      setProducts(prodPayload.items ?? (Array.isArray(prodPayload) ? prodPayload : []));
      
      const catPayload = (catRes as any).data ?? catRes;
      setCategories(Array.isArray(catPayload) ? catPayload : []);
    } catch (err: any) {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  // Cart Helpers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setSuccess(false);
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  }, [cart]);

  // Customer Search Logic
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCustomerSearching(true);
      try {
        const res = await customersApi.list({ search: customerSearch, limit: 5 });
        const payload = (res as any).data ?? res;
        setCustomerResults(payload.items ?? (Array.isArray(payload) ? payload : []));
      } catch {
        setCustomerResults([]);
      } finally {
        setIsCustomerSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      // Record purchase for each item? No, the current backend /purchases API takes total amount.
      // We will summarize the cart into one purchase.
      // If no customer selected, it might still record if the API allows it (usually requires customerId).
      if (!selectedCustomer) {
        throw new Error('Please select a customer to award points.');
      }

      await purchasesApi.create({
        customerId: selectedCustomer.id,
        amount: cartTotal
      });

      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setSuccess(true);
      // Optional: show a receipt modal or toast
    } catch (err: any) {
      setError(err.message || 'Checkout failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pos-page">
      {/* Left Section: Products */}
      <section className="pos-products-section">
        <div className="pos-search-bar">
          <svg className="pos-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pos-categories">
          <button 
            className={`pos-category-pill ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`pos-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="pos-grid">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="pos-card" style={{ opacity: 0.6 }}>
                <div className="pos-card-img-wrap"><div className="adm-skeleton" style={{ width: '100%', height: '100%' }} /></div>
                <div className="pos-card-info">
                  <div className="adm-skeleton" style={{ width: '80%', height: 14, marginBottom: 8 }} />
                  <div className="adm-skeleton" style={{ width: '40%', height: 14 }} />
                </div>
              </div>
            ))
          ) : filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--shop-text-muted)' }}>
              No products found.
            </div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} className="pos-card" onClick={() => addToCart(p)}>
                <div className="pos-card-img-wrap">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="pos-card-img" />
                  ) : (
                    <div className="pos-card-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="pos-card-info">
                  <div className="pos-card-name">{p.name}</div>
                  <div className="pos-card-price">Rs. {Number(p.price).toLocaleString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Right Section: Cart Terminal */}
      <aside className="pos-cart-section">
        <div className="pos-cart-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Current Order</h2>
            <button 
              className="shop-btn shop-btn--ghost" 
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={() => setCart([])}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="pos-customer-area">
          {selectedCustomer ? (
            <div className="pos-selected-customer">
              <div className="pos-customer-avatar">
                {selectedCustomer.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{selectedCustomer.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--shop-text-secondary)' }}>{selectedCustomer.phone}</div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', color: 'var(--shop-text-muted)', cursor: 'pointer' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="pos-customer-search-wrap">
              <svg 
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--shop-text-muted)' }}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <input 
                className="pos-customer-input"
                placeholder="Find customer for points..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {isCustomerSearching && (
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--shop-text-muted)', fontSize: '0.75rem' }}>
                  Searching…
                </div>
              )}
              {customerResults.length > 0 && (
                <div className="pos-customer-results">
                  {customerResults.map(c => (
                    <div key={c.id} className="pos-customer-item" onClick={() => setSelectedCustomer(c)}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--shop-text-secondary)' }}>{c.phone}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: 12, opacity: 0.5 }}>
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p>Your cart is empty.<br/>Tap products to add them.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="pos-cart-item">
                {item.product.imageUrl ? (
                  <img 
                    src={item.product.imageUrl} 
                    alt={item.product.name} 
                    style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} 
                  />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div className="pos-item-info">
                  <div className="pos-item-name">{item.product.name}</div>
                  <div className="pos-item-price">Rs. {Number(item.product.price).toLocaleString()}</div>
                </div>
                <div className="pos-item-qty">
                  <button className="pos-qty-btn" onClick={() => updateQty(item.product.id, -1)}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button className="pos-qty-btn" onClick={() => updateQty(item.product.id, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pos-cart-footer">
          {error && <div style={{ color: 'var(--shop-primary)', fontSize: '0.8rem', marginBottom: 12, fontWeight: 600 }}>{error}</div>}
          {success && <div style={{ color: '#059669', fontSize: '0.8rem', marginBottom: 12, fontWeight: 600 }}>✓ Sale completed successfully!</div>}
          
          <div className="pos-summary-row">
            <span>Subtotal</span>
            <span>Rs. {cartTotal.toLocaleString()}</span>
          </div>
          <div className="pos-summary-row">
            <span>Tax (0%)</span>
            <span>Rs. 0</span>
          </div>
          <div className="pos-summary-total">
            <span>Total</span>
            <span>Rs. {cartTotal.toLocaleString()}</span>
          </div>
          
          <button 
            className="pos-checkout-btn"
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </aside>
    </div>
  );
}
