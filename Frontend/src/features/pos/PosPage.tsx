import { useState, useEffect, useCallback, useMemo, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { productsApi } from '../../api/products';
import { customersApi } from '../../api/customers';
import { purchasesApi } from '../../api/purchases';
import { promotionsApi } from '../../api/promotions';
import { posApi } from '../../api/pos';
import { settingsApi } from '../../api/settings';
import { redemptionsApi } from '../../api/redemptions';
import type { Product, ProductCategory, Customer } from '../../types';
import type { HeldOrder, RegisterShift } from '../../types/pos';
import { useAuth } from '../../hooks/useAuth';
import './pos.css';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  source: 'original' | 'added';
  unitPrice: number;
}

interface ReceiptSnapshot {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paid: number;
  change: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  totalPoints?: number;
}

const OFFLINE_QUEUE_KEY = 'pos_offline_sales_queue';

function toMoney(v: number): string {
  return `Rs. ${Number(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PosPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const isStaff = user?.role === 'staff';
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [promoPreview, setPromoPreview] = useState<any>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [managerPassword, setManagerPassword] = useState('');
  const [showManagerPrompt, setShowManagerPrompt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'gift_card' | 'split'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [cardReference, setCardReference] = useState('');
  const [receipt, setReceipt] = useState<ReceiptSnapshot | null>(null);
  const [currentShift, setCurrentShift] = useState<RegisterShift | null>(null);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [offlineQueued, setOfflineQueued] = useState(0);
  
  // Customer State
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSearching, setIsCustomerSearching] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createCustomerError, setCreateCustomerError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [returningPurchaseId, setReturningPurchaseId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Loyalty State
  const [settings, setSettings] = useState<any>(null);
  const [redemptionPreview, setRedemptionPreview] = useState<any>(null);
  const [applyRedemption, setApplyRedemption] = useState(false);
  const [redemptionPoints, setRedemptionPoints] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
    settingsApi.get().then((res) => setSettings(((res as any).data ?? res))).catch(() => {});
  }, [fetchData]);

  const refreshHeldOrders = useCallback(async () => {
    try {
      const res = await posApi.heldOrders({ status: 'parked' });
      setHeldOrders(((res as any).data ?? res) as HeldOrder[]);
    } catch {
      setHeldOrders([]);
    }
  }, []);

  useEffect(() => {
    posApi.currentShift()
      .then((res) => setCurrentShift(((res as any).data ?? res) as RegisterShift | null))
      .catch(() => setCurrentShift(null));
    refreshHeldOrders();
    try {
      setOfflineQueued(JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]').length);
    } catch {
      setOfflineQueued(0);
    }
  }, [refreshHeldOrders]);

  // Load a past sale into cart for returns/edits
  useEffect(() => {
    const id = searchParams.get('returnPurchaseId');
    if (!id) return;

    (async () => {
      try {
        const res = await purchasesApi.get(id);
        const purchase = (res as any).data ?? res;

        if (purchase.isVoided) {
          setError('This sale is already voided.');
          return;
        }

        setReturningPurchaseId(purchase.id);
        setSelectedCustomer(purchase.customer || null);

        const items = purchase.items || [];
        if (items.length === 0) {
          setError('This sale has no saved line items to return.');
          return;
        }

        setCart(
          items.map((it: any) => {
            const found = it.productId ? products.find((p) => p.id === it.productId) : undefined;
            const fallback: Product = {
              id: it.productId || `manual_${it.id}`,
              shopId: purchase.shopId,
              categoryId: null,
              name: it.name,
              sku: it.sku || 'MANUAL',
              barcode: null,
              description: null,
              unit: null,
              price: Number(it.unitPrice),
              cost: null,
              taxRate: null,
              trackInventory: false,
              stockOnHand: 0,
              reorderLevel: 0,
              isActive: true,
              createdAt: purchase.createdAt,
              updatedAt: purchase.createdAt,
              deletedAt: null,
              category: null,
            };
            return {
              id: `orig_${it.id}`,
              product: found || fallback,
              quantity: Number(it.quantity),
              source: 'original',
              unitPrice: Number(it.unitPrice),
            } as CartItem;
          }),
        );

        // Clean up URL param after loading
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('returnPurchaseId');
          return next;
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load sale for return.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchParams, setSearchParams]);

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
      const existingAdded = prev.find((item) => item.product.id === product.id && item.source === 'added');
      if (existingAdded) {
        return prev.map((item) =>
          item.id === existingAdded.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...prev,
        {
          id: `line_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          product,
          quantity: 1,
          source: 'added',
          unitPrice: Number(product.price),
        },
      ];
    });
    setSuccess(false);
  };

  const setLinePrice = (lineId: string, price: number) => {
    setCart((prev) =>
      prev.map((it) => (it.id === lineId ? { ...it, unitPrice: Math.max(0, Number(price) || 0) } : it)),
    );
  };

  const updateQty = (lineId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === lineId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.unitPrice) * item.quantity), 0);
  }, [cart]);

  const computeDiscount = (pts: number) => {
    if (pts < 1) return 0;
    const mode = redemptionPreview?.maxRedeemMode ?? settings?.maxRedeemMode;
    const rate = Number(redemptionPreview?.redemptionValue ?? settings?.redemptionValue ?? 500);
    if (mode === 'flat_amount') return pts / rate;
    if (mode === 'percent_of_bill') return (rate / 100) * (promoPreview?.subtotal ?? cartTotal);
    return 0;
  };
  const pointsDiscountValue = applyRedemption ? computeDiscount(redemptionPoints) : 0;
  const discountTotal = useMemo(() => Number(promoPreview?.discountTotal ?? 0) + pointsDiscountValue, [promoPreview, pointsDiscountValue]);
  const netTotal = useMemo(() => Math.max(0, Number(promoPreview?.total ?? cartTotal) - pointsDiscountValue), [cartTotal, promoPreview, pointsDiscountValue]);
  const taxTotal = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => {
      const rate = Number(item.product.taxRate || 0);
      if (!Number.isFinite(rate) || rate <= 0) return sum;
      return sum + (Number(item.unitPrice) * item.quantity * rate) / 100;
    }, 0);
    return Math.max(0, subtotal);
  }, [cart]);
  const payableTotal = useMemo(() => Math.max(0, netTotal + taxTotal), [netTotal, taxTotal]);
  const pointsEarned = useMemo(() => {
    if (!settings?.pointsPerAmount) return 0;
    return Math.floor(payableTotal / Number(settings.pointsPerAmount));
  }, [payableTotal, settings]);
  const paidAmount = useMemo(() => {
    if (paymentMethod === 'cash' || paymentMethod === 'split') {
      if (cashReceived === '') return payableTotal;
      return Number(cashReceived || 0);
    }
    return payableTotal;
  }, [cashReceived, payableTotal, paymentMethod]);
  const changeDue = useMemo(() => Math.max(0, paidAmount - payableTotal), [paidAmount, payableTotal]);

  useEffect(() => {
    if (selectedCustomer && selectedCustomer.totalPoints >= (settings?.minRedeemPoints || 0)) {
      const minPts = settings?.minRedeemPoints ?? 0;
      redemptionsApi.preview(selectedCustomer.id, selectedCustomer.totalPoints).then(res => {
        setRedemptionPreview((res as any).data ?? res);
        if (!applyRedemption) {
          setRedemptionPoints(minPts > 0 && settings?.maxRedeemMode === 'percent_of_bill' ? minPts : selectedCustomer.totalPoints);
        }
      }).catch(() => setRedemptionPreview(null));
    } else {
      setRedemptionPreview(null);
      setApplyRedemption(false);
      setRedemptionPoints(0);
    }
  }, [selectedCustomer, settings, applyRedemption]);

  const hasPriceOverrides = useMemo(() => {
    return cart.some((it) => Math.abs(Number(it.unitPrice) - Number(it.product.price)) > 0.009);
  }, [cart]);

  // Live promo preview (debounced)
  useEffect(() => {
    if (cart.length === 0) {
      setPromoPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      setPromoLoading(true);
      try {
        const itemsPayload = cart.map((ci) => ({
          productId: ci.product.id.startsWith('manual_') ? null : ci.product.id,
          name: ci.product.name,
          sku: ci.product.sku || null,
          unitPrice: Number(ci.unitPrice),
          quantity: ci.quantity,
          taxRate: Number(ci.product.taxRate || 0),
          taxMode: (ci.product as any).taxMode || 'exclusive',
        }));
        const res = await promotionsApi.preview({
          couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
          items: itemsPayload,
        } as any);
        setPromoPreview((res as any).data ?? res);
      } catch {
        setPromoPreview(null);
      } finally {
        setPromoLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [cart, couponCode]);

  // Customer Search Logic
  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) {
      setCustomerResults([]);
      setCreateCustomerError(null);
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

  function normaliseSriLankanPhone(input: string): string | null {
    let digits = input.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (digits.startsWith('94')) digits = digits.slice(2);
    if (digits.length !== 9) return null;
    if (!digits.startsWith('7')) return null;
    return `+94${digits}`;
  }

  const createPhone = useMemo(() => normaliseSriLankanPhone(customerSearch), [customerSearch]);
  const showCreateCustomer =
    !selectedCustomer &&
    customerSearch.trim().length >= 2 &&
    !isCustomerSearching &&
    customerResults.length === 0;

  const handleCreateCustomer = useCallback(async () => {
    if (!createPhone) {
      setCreateCustomerError('Enter a valid Sri Lankan mobile number (7XXXXXXXX after +94).');
      return;
    }
    if (!newCustomerName.trim()) {
      setCreateCustomerError('Enter customer name.');
      return;
    }

    setIsCreatingCustomer(true);
    setCreateCustomerError(null);
    try {
      const res = await customersApi.create({ name: newCustomerName.trim(), phone: createPhone });
      const createdCustomer = (res as any).data ?? res;
      setSelectedCustomer(createdCustomer);
      setCustomerSearch('');
      setCustomerResults([]);
      setNewCustomerName('');
    } catch (err: any) {
      setCreateCustomerError(err.message || 'Failed to create customer.');
    } finally {
      setIsCreatingCustomer(false);
    }
  }, [createPhone, newCustomerName]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      if (!selectedCustomer) {
        throw new Error('Please select a customer to award points.');
      }
      if (hasPriceOverrides && !managerPassword.trim()) {
        setShowManagerPrompt(true);
        throw new Error('Manager password required for price override.');
      }
      if ((paymentMethod === 'cash' || paymentMethod === 'split') && paidAmount < payableTotal) {
        throw new Error('Cash received is less than the total due.');
      }

      const itemsPayload = cart.map((ci) => ({
        productId: ci.product.id.startsWith('manual_') ? null : ci.product.id,
        name: ci.product.name,
        sku: ci.product.sku || null,
        unitPrice: Number(ci.unitPrice),
        quantity: ci.quantity,
      }));

      // Return/update flow: void old purchase first, then create a new one from edited cart.
      if (returningPurchaseId) {
        await purchasesApi.void(returningPurchaseId);
      }

      const payload = {
        customerId: selectedCustomer.id,
        items: itemsPayload,
        couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
        managerPassword: hasPriceOverrides ? managerPassword.trim() : null,
        paymentMethod,
        paidAmount,
        shiftId: currentShift?.id || null,
        redemptionPoints: applyRedemption ? redemptionPoints : 0,
        payments: [{
          tenderType: paymentMethod,
          amount: paidAmount,
          reference: cardReference.trim() || null,
          status: 'captured',
        }],
        createKitchenTicket: true,
      };

      const created = await purchasesApi.create(payload);
      const savedPurchase = (created as any).data ?? created;

      setReceipt({
        id: savedPurchase?.id || `receipt_${Date.now()}`,
        createdAt: savedPurchase?.createdAt || new Date().toISOString(),
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        items: cart,
        subtotal: cartTotal,
        discount: discountTotal,
        tax: taxTotal,
        total: payableTotal,
        paymentMethod,
        paid: paidAmount,
        change: changeDue,
        pointsEarned: savedPurchase?.pointsEarned ?? pointsEarned,
        pointsRedeemed: applyRedemption ? redemptionPoints : 0,
        totalPoints: Math.max(0, (selectedCustomer?.totalPoints || 0) + (savedPurchase?.pointsEarned ?? pointsEarned) - (applyRedemption ? redemptionPoints : 0)),
      });

      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setReturningPurchaseId(null);
      setCouponCode('');
      setCashReceived('');
      setCardReference('');
      setSuccess(true);
    } catch (err: any) {
      const isNetworkError = /failed to fetch|network|load failed/i.test(String(err?.message || ''));
      if (isNetworkError && selectedCustomer) {
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        queue.push({
          id: `offline_${Date.now()}`,
          createdAt: new Date().toISOString(),
          customerId: selectedCustomer.id,
          items: cart.map((ci) => ({
            productId: ci.product.id.startsWith('manual_') ? null : ci.product.id,
            name: ci.product.name,
            sku: ci.product.sku || null,
            unitPrice: Number(ci.unitPrice),
            quantity: ci.quantity,
            taxRate: Number(ci.product.taxRate || 0),
            taxMode: (ci.product as any).taxMode || 'exclusive',
          })),
          couponCode: couponCode.trim() ? couponCode.trim().toUpperCase() : null,
          paymentMethod,
          paidAmount,
        });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        setOfflineQueued(queue.length);
        setCart([]);
        setSelectedCustomer(null);
        setError('Network unavailable. Sale saved to offline queue for sync.');
        return;
      }
      setError(err.message || 'Checkout failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const holdCurrentOrder = async () => {
    if (cart.length === 0) return;
    try {
      await posApi.createHeldOrder({
        customerId: selectedCustomer?.id || null,
        status: 'parked',
        label: selectedCustomer?.name || `Order ${new Date().toLocaleTimeString()}`,
        subtotal: cartTotal,
        cart: { cart, couponCode, customer: selectedCustomer },
      });
      setCart([]);
      setSelectedCustomer(null);
      setCouponCode('');
      refreshHeldOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to hold order.');
    }
  };

  const resumeHeldOrder = async (order: HeldOrder) => {
    const payload = order.cart as any;
    setCart(payload.cart || []);
    setCouponCode(payload.couponCode || '');
    setSelectedCustomer(payload.customer || null);
    await posApi.updateHeldOrder(order.id, { status: 'converted' } as any);
    refreshHeldOrders();
  };

  const syncOfflineQueue = async () => {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    const remaining = [];
    for (const sale of queue) {
      try {
        await purchasesApi.create({ ...sale, shiftId: currentShift?.id || null });
      } catch {
        remaining.push(sale);
      }
    }
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    setOfflineQueued(remaining.length);
    setError(remaining.length ? `${remaining.length} offline sale(s) still could not sync.` : null);
  };

  const handleProductSearchKeyDown = async (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const query = search.trim();
    if (!query) return;
    const exact = products.find((p) => p.barcode === query || p.sku.toLowerCase() === query.toLowerCase());
    if (exact) {
      addToCart(exact);
      setSearch('');
      return;
    }
    try {
      const res = await productsApi.lookup({ barcode: query, sku: query });
      const payload = (res as any).data ?? res;
      const product = payload.data ?? payload;
      if (product?.id) {
        addToCart(product);
        setSearch('');
      }
    } catch {
      // Keep the search text so the cashier can continue filtering manually.
    }
  };

  return (
    <div className="pos-page">
      {showManagerPrompt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div className="adm-card" style={{ width: 'min(480px, 100%)', padding: 18 }}>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', marginBottom: 6 }}>Manager override required</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>
              One or more line items have a price override. Enter the owner password to continue.
            </div>
            <input
              className="adm-input"
              type="password"
              value={managerPassword}
              onChange={(e) => setManagerPassword(e.target.value)}
              placeholder="Owner password"
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => { setShowManagerPrompt(false); setManagerPassword(''); }}>
                Cancel
              </button>
              <button className="adm-btn adm-btn--primary" onClick={() => setShowManagerPrompt(false)}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      {receipt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div className="adm-card" style={{ width: 'min(520px, 100%)', padding: 20 }}>
            <div className="receipt-print-area">
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>LoyaltyOS Receipt</div>
                <div style={{ color: 'var(--shop-text-secondary)', fontSize: '0.82rem' }}>{new Date(receipt.createdAt).toLocaleString('en-GB')}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', marginTop: 4 }}>{receipt.id}</div>
              </div>
              <div style={{ borderTop: '1px dashed var(--shop-border)', borderBottom: '1px dashed var(--shop-border)', padding: '10px 0', marginBottom: 12 }}>
                <div style={{ fontWeight: 800 }}>{receipt.customerName}</div>
                <div style={{ color: 'var(--shop-text-secondary)', fontSize: '0.82rem' }}>{receipt.customerPhone}</div>
              </div>
              {receipt.items.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{item.product.name}</div>
                    <div style={{ color: 'var(--shop-text-secondary)', fontSize: '0.78rem' }}>{item.quantity} x {toMoney(Number(item.unitPrice))}</div>
                  </div>
                  <div style={{ fontWeight: 900 }}>{toMoney(Number(item.unitPrice) * item.quantity)}</div>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--shop-border)', marginTop: 12, paddingTop: 12, display: 'grid', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><strong>{toMoney(receipt.subtotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><strong>- {toMoney(receipt.discount)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><strong>{toMoney(receipt.tax)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem' }}><span>Total</span><strong>{toMoney(receipt.total)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Paid ({receipt.paymentMethod.replace('_', ' ')})</span><strong>{toMoney(receipt.paid)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Change</span><strong>{toMoney(receipt.change)}</strong></div>
              </div>
              <div style={{ borderTop: '1px dashed var(--shop-border)', marginTop: 12, paddingTop: 12, display: 'grid', gap: 6, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Points Earned</span><strong style={{ color: '#059669' }}>+{receipt.pointsEarned || 0}</strong></div>
                {(receipt.pointsRedeemed || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Points Used</span><strong style={{ color: '#dc2626' }}>-{receipt.pointsRedeemed}</strong></div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>New Point Balance</span><strong>{receipt.totalPoints || 0}</strong></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setReceipt(null)}>Close</button>
              <button className="adm-btn adm-btn--primary" onClick={() => window.print()}>Print</button>
            </div>
          </div>
        </div>
      )}
      {isMenuOpen && (
        <>
          <div className="pos-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
          <aside className="pos-menu-drawer">
            <div className="pos-menu-header">
              <div>
                <div className="pos-menu-title">POS Menu</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--shop-text-secondary)', fontWeight: 700 }}>Navigate without leaving full-screen</div>
              </div>
              <button className="pos-menu-close" onClick={() => setIsMenuOpen(false)} aria-label="Close menu" title="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <nav className="pos-menu-links" onClick={() => setIsMenuOpen(false)}>
              {!isStaff && <NavLink className="pos-menu-link" to="/dashboard">Dashboard</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/customers">Customers</NavLink>}
              <NavLink className="pos-menu-link" to="/sales">Sales</NavLink>
              <NavLink className="pos-menu-link" to="/shifts">Shifts</NavLink>
              {!isStaff && <NavLink className="pos-menu-link" to="/reports">Reports</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/gift-cards">Gift Cards</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/messages">Messages</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/rewards">Rewards</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/redeem">Redeem</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/users">Staff</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/products">Products</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/inventory">Inventory</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/operations">Operations</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/promotions">Promotions</NavLink>}
              {!isStaff && <NavLink className="pos-menu-link" to="/settings">Settings</NavLink>}
            </nav>

            <div className="pos-menu-exit">
              <button
                type="button"
                className="pos-exit-btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (isStaff) {
                    clearAuth();
                  } else {
                    navigate('/dashboard');
                  }
                }}
              >
                {isStaff ? 'Log out' : 'Exit POS (Back to Dashboard)'}
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Left Section: Products */}
      <section className="pos-products-section">
        {returningPurchaseId && (
          <div className="pos-return-banner">
            <div>
              <div style={{ fontWeight: 900 }}>Return / Edit Sale</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--shop-text-secondary)' }}>
                This checkout will void the original sale and save a new one.
              </div>
            </div>
            <button
              type="button"
              className="pos-return-cancel"
              onClick={() => {
                setReturningPurchaseId(null);
                setCart([]);
                setSelectedCustomer(null);
                setSuccess(false);
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="pos-products-header">
          <button
            type="button"
            className="pos-menu-btn"
            onClick={() => setIsMenuOpen(true)}
            aria-label="Open menu"
            title="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="pos-search-bar">
          <svg className="pos-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
              <input 
            type="text" 
            placeholder="Search products by name, SKU, or scan barcode..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleProductSearchKeyDown}
          />
        </div>

        {(heldOrders.length > 0 || offlineQueued > 0 || currentShift) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
            {currentShift && <span className="adm-badge adm-badge--success">Shift open</span>}
            {heldOrders.map((order) => (
              <button key={order.id} className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => resumeHeldOrder(order)}>
                Resume {order.label || 'Held order'}
              </button>
            ))}
            {offlineQueued > 0 && (
              <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={syncOfflineQueue}>
                Sync offline ({offlineQueued})
              </button>
            )}
          </div>
        )}
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
            <button
              className="shop-btn shop-btn--ghost"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              onClick={holdCurrentOrder}
              disabled={cart.length === 0}
            >
              Hold
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
                placeholder="Search customer (phone/name)..."
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

              {showCreateCustomer && (
                <div className="pos-customer-create">
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: 6 }}>No customer found</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--shop-text-secondary)', marginBottom: 10 }}>
                    Create a new customer and continue checkout.
                  </div>

                  {createCustomerError && (
                    <div style={{ color: 'var(--shop-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8 }}>
                      {createCustomerError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      className="pos-customer-input"
                      style={{ paddingLeft: 12 }}
                      placeholder="Customer name"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--shop-text-muted)' }}>
                      {createPhone ? createPhone : 'Phone invalid'}
                    </div>
                    <button
                      type="button"
                      className="pos-create-btn"
                      onClick={handleCreateCustomer}
                      disabled={isCreatingCustomer}
                    >
                      {isCreatingCustomer ? 'Creating…' : 'Create'}
                    </button>
                  </div>
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
              <div key={item.id} className="pos-cart-item">
                <div className="pos-item-info">
                  <div className="pos-item-name">
                    {item.product.name}
                    {returningPurchaseId && (
                      <span className={`pos-line-badge ${item.source === 'original' ? 'orig' : 'added'}`}>
                        {item.source === 'original' ? 'Original' : 'Added'}
                      </span>
                    )}
                  </div>
                  <div className="pos-item-price">
                    Rs. {Number(item.unitPrice).toLocaleString()}
                    {Math.abs(Number(item.unitPrice) - Number(item.product.price)) > 0.009 ? (
                      <span style={{ marginLeft: 8, fontSize: '0.7rem', fontWeight: 800, color: 'var(--shop-primary)' }}>
                        OVERRIDE
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="pos-item-qty">
                  <button className="pos-qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button className="pos-qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <div style={{ marginLeft: 10 }}>
                  <button
                    type="button"
                    className="pos-qty-btn"
                    title="Edit price"
                    onClick={() => {
                      const next = prompt('Unit price (Rs.)', String(item.unitPrice));
                      if (next === null) return;
                      const v = Number(next);
                      if (!Number.isFinite(v) || v < 0) return alert('Invalid price');
                      setLinePrice(item.id, v);
                    }}
                  >
                    âœŽ
                  </button>
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
            <span>{toMoney(promoPreview?.subtotal ?? cartTotal)}</span>
          </div>
          <div className="pos-summary-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Discount
              {promoLoading ? <span style={{ fontSize: '0.72rem', color: 'var(--shop-text-muted)' }}>calculating…</span> : null}
            </span>
            <span style={{ color: '#059669', fontWeight: 800 }}>
              - {toMoney(discountTotal)}
            </span>
          </div>

          {redemptionPreview && selectedCustomer && (
            <div className="pos-summary-row" style={{ background: 'var(--shop-bg)', padding: '8px 12px', borderRadius: 8, marginTop: 4, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 6, border: '1px solid var(--shop-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                  <input 
                    type="checkbox" 
                    checked={applyRedemption} 
                    onChange={(e) => setApplyRedemption(e.target.checked)} 
                    style={{ accentColor: 'var(--shop-primary)', width: 16, height: 16 }}
                  />
                  Use Loyalty Points ({selectedCustomer.totalPoints} pts available)
                </label>
                {applyRedemption && (
                  <span style={{ color: '#059669', fontWeight: 800 }}>
                    - {toMoney(pointsDiscountValue)}
                  </span>
                )}
              </div>
              
              {applyRedemption && settings?.maxRedeemMode === 'flat_amount' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="number"
                    className="pos-customer-input"
                    style={{ padding: '4px 8px', fontSize: '0.8rem', width: 80 }}
                    min={1}
                    max={selectedCustomer.totalPoints}
                    value={redemptionPoints}
                    onChange={(e) => setRedemptionPoints(Math.min(selectedCustomer.totalPoints, Math.max(1, parseInt(e.target.value) || 0)))}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--shop-text-secondary)' }}>pts to use</span>
                </div>
              )}
            </div>
          )}

          <div className="pos-summary-row">
            <span>Tax</span>
            <span>{toMoney(taxTotal)}</span>
          </div>
          <div className="pos-summary-total">
            <span>Total</span>
            <span>{toMoney(payableTotal)}</span>
          </div>

          {selectedCustomer && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(15,23,42,0.03)', borderRadius: 6, fontSize: '0.8rem', border: '1px dashed var(--shop-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--shop-text-secondary)' }}>Points to Earn</span>
                <span style={{ fontWeight: 800, color: '#059669' }}>+{pointsEarned} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--shop-text-secondary)' }}>Current Balance</span>
                <span style={{ fontWeight: 800 }}>{selectedCustomer.totalPoints} pts</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <input
              className="pos-customer-input"
              placeholder="Coupon code (optional)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="pos-create-btn"
              disabled={promoLoading}
              onClick={() => setCouponCode((c) => c.trim().toUpperCase())}
            >
              Apply
            </button>
          </div>

          <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
            <select
              className="pos-customer-input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="gift_card">Gift Card</option>
              <option value="split">Split Payment</option>
            </select>
            {(paymentMethod === 'cash' || paymentMethod === 'split') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                <input
                  className="pos-customer-input"
                  placeholder="Cash received"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  inputMode="decimal"
                />
                <div style={{ fontWeight: 900, color: 'var(--shop-text-secondary)' }}>
                  Change {toMoney(changeDue)}
                </div>
              </div>
            )}
            {(paymentMethod === 'card' || paymentMethod === 'split') && (
              <input
                className="pos-customer-input"
                placeholder="Card reference (optional)"
                value={cardReference}
                onChange={(e) => setCardReference(e.target.value)}
              />
            )}
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
