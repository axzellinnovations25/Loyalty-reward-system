import { useCallback, useEffect, useMemo, useState } from 'react';
import { posApi } from '../../api/pos';
import { purchasesApi } from '../../api/purchases';
import type { PosPayment, PosReceipt, PosRefund, Supplier, TaxRate, KitchenTicket, PosTerminal, PurchaseOrder } from '../../types/pos';
import type { Purchase } from '../../types';

function unwrap<T>(res: any): T {
  return (res?.data ?? res) as T;
}

function rows<T>(res: any): T[] {
  const payload = unwrap<any>(res);
  return payload.items ?? (Array.isArray(payload) ? payload : []);
}

function money(v: unknown): string {
  return `Rs. ${Number(v || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Tab = 'payments' | 'refunds' | 'suppliers' | 'tax' | 'permissions' | 'kitchen' | 'terminals';

export default function OperationsPage() {
  const [tab, setTab] = useState<Tab>('payments');
  const [payments, setPayments] = useState<PosPayment[]>([]);
  const [receipts, setReceipts] = useState<PosReceipt[]>([]);
  const [refunds, setRefunds] = useState<PosRefund[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [terminals, setTerminals] = useState<PosTerminal[]>([]);
  const [sales, setSales] = useState<Purchase[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [paymentRes, receiptRes, refundRes, supplierRes, poRes, taxRes, ticketRes, terminalRes, salesRes] = await Promise.all([
      posApi.payments({ limit: 30 }),
      posApi.receipts({ limit: 30 }),
      posApi.refunds({ limit: 30 }),
      posApi.suppliers(),
      posApi.purchaseOrders({ limit: 30 }),
      posApi.taxRates(),
      posApi.kitchenTickets(),
      posApi.terminals(),
      purchasesApi.list({ limit: 30 }),
    ]);
    setPayments(rows<PosPayment>(paymentRes));
    setReceipts(rows<PosReceipt>(receiptRes));
    setRefunds(rows<PosRefund>(refundRes));
    setSuppliers(unwrap<Supplier[]>(supplierRes));
    setOrders(rows<PurchaseOrder>(poRes));
    setTaxRates(unwrap<TaxRate[]>(taxRes));
    setTickets(unwrap<KitchenTicket[]>(ticketRes));
    setTerminals(unwrap<PosTerminal[]>(terminalRes));
    setSales(rows<Purchase>(salesRes));
  }, []);

  useEffect(() => {
    load().catch((err) => setMessage(err.message || 'Failed to load operations.'));
  }, [load]);

  const tabs = useMemo(() => [
    ['payments', 'Payments & Receipts'],
    ['refunds', 'Refunds'],
    ['suppliers', 'Suppliers & POs'],
    ['tax', 'Tax'],
    ['permissions', 'Permissions'],
    ['kitchen', 'Kitchen'],
    ['terminals', 'Terminals'],
  ] as Array<[Tab, string]>, []);

  async function createSupplier() {
    await posApi.createSupplier({ name: form.supplierName, phone: form.supplierPhone, email: form.supplierEmail });
    setForm({});
    load();
  }

  async function createTaxRate() {
    await posApi.createTaxRate({ name: form.taxName, rate: Number(form.taxRate || 0), mode: (form.taxMode || 'exclusive') as any, isDefault: form.taxDefault === 'true', isActive: true });
    setForm({});
    load();
  }

  async function createTerminal() {
    await posApi.createTerminal({ name: form.terminalName, code: form.terminalCode, location: form.terminalLocation });
    setForm({});
    load();
  }

  async function createRefund() {
    await posApi.createRefund({ purchaseId: form.refundPurchaseId, reason: form.refundReason || 'Customer refund', method: 'original_payment' });
    setForm({});
    load();
  }

  async function createPurchaseOrder() {
    await posApi.createPurchaseOrder({ supplierId: form.poSupplierId || null, notes: form.poNotes, items: [] });
    setForm({});
    load();
  }

  async function savePermissions() {
    const keys = ['discount.approve', 'refund.create', 'price.override', 'reports.view', 'cash.drawer', 'inventory.adjust'];
    const permissions = keys.map((key) => ({ role: 'staff', permissionKey: key, enabled: form[key] === 'true' }));
    await posApi.setPermissions(permissions);
    setMessage('Permissions updated.');
  }

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">POS Operations</h1>
          <p className="adm-page-subtitle">Professional POS controls for payments, receipts, refunds, purchasing, tax, permissions, and tickets.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {tabs.map(([id, label]) => (
          <button key={id} className={`adm-btn adm-btn--sm ${tab === id ? 'adm-btn--primary' : 'adm-btn--ghost'}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {message && <div className="adm-alert" style={{ marginBottom: 14 }}>{message}</div>}

      {tab === 'payments' && (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Payment</th><th>Method</th><th>Status</th><th>Reference</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>{payments.map((p) => <tr key={p.id}><td style={{ fontFamily: 'monospace' }}>{p.id.slice(0, 8)}</td><td>{p.tenderType}</td><td>{p.status}</td><td>{p.reference || '-'}</td><td style={{ textAlign: 'right', fontWeight: 900 }}>{money(p.amount)}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="adm-table-wrap" style={{ marginTop: 14 }}>
            <table className="adm-table">
              <thead><tr><th>Receipt</th><th>Date</th><th style={{ textAlign: 'center' }}>Reprints</th><th style={{ textAlign: 'right' }}>Total</th><th></th></tr></thead>
              <tbody>{receipts.map((r) => <tr key={r.id}><td style={{ fontWeight: 900 }}>{r.receiptNumber}</td><td>{new Date(r.createdAt).toLocaleString('en-GB')}</td><td style={{ textAlign: 'center' }}>{r.reprintCount}</td><td style={{ textAlign: 'right' }}>{money(r.total)}</td><td><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => posApi.reprintReceipt(r.id).then(load)}>Reprint Log</button></td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'refunds' && (
        <>
          <div className="adm-card" style={{ padding: 16, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'end' }}>
            <select className="adm-input" style={{ width: 320 }} value={form.refundPurchaseId || ''} onChange={(e) => setForm((f) => ({ ...f, refundPurchaseId: e.target.value }))}>
              <option value="">Select sale to refund</option>
              {sales.filter((s) => !s.isVoided).map((s) => <option key={s.id} value={s.id}>{s.receiptNumber || s.id.slice(0, 8)} - {s.customer?.name || '-'} - {money(s.amount)}</option>)}
            </select>
            <input className="adm-input" placeholder="Reason" value={form.refundReason || ''} onChange={(e) => setForm((f) => ({ ...f, refundReason: e.target.value }))} />
            <button className="adm-btn adm-btn--primary" disabled={!form.refundPurchaseId} onClick={createRefund}>Refund Full Sale</button>
          </div>
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Refund</th><th>Reason</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead><tbody>{refunds.map((r) => <tr key={r.id}><td>{r.refundNumber || r.id.slice(0, 8)}</td><td>{r.reason}</td><td>{r.status}</td><td style={{ textAlign: 'right', fontWeight: 900 }}>{money(r.amount)}</td></tr>)}</tbody></table></div>
        </>
      )}

      {tab === 'suppliers' && (
        <>
          <div className="adm-card" style={{ padding: 16, marginBottom: 14, display: 'grid', gridTemplateColumns: '1fr 180px 220px auto auto', gap: 8 }}>
            <input className="adm-input" placeholder="Supplier name" value={form.supplierName || ''} onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))} />
            <input className="adm-input" placeholder="Phone" value={form.supplierPhone || ''} onChange={(e) => setForm((f) => ({ ...f, supplierPhone: e.target.value }))} />
            <input className="adm-input" placeholder="Email" value={form.supplierEmail || ''} onChange={(e) => setForm((f) => ({ ...f, supplierEmail: e.target.value }))} />
            <button className="adm-btn adm-btn--primary" onClick={createSupplier}>Add Supplier</button>
            <button className="adm-btn adm-btn--ghost" onClick={createPurchaseOrder}>New PO</button>
          </div>
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Supplier</th><th>Phone</th><th>Email</th><th>Status</th></tr></thead><tbody>{suppliers.map((s) => <tr key={s.id}><td style={{ fontWeight: 900 }}>{s.name}</td><td>{s.phone || '-'}</td><td>{s.email || '-'}</td><td>{s.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>
          <div className="adm-table-wrap" style={{ marginTop: 14 }}><table className="adm-table"><thead><tr><th>PO</th><th>Supplier</th><th>Status</th><th style={{ textAlign: 'right' }}>Subtotal</th><th></th></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td>{o.orderNumber}</td><td>{o.supplier?.name || '-'}</td><td>{o.status}</td><td style={{ textAlign: 'right' }}>{money(o.subtotal)}</td><td><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => posApi.receivePurchaseOrder(o.id, {}).then(load)}>Receive</button></td></tr>)}</tbody></table></div>
        </>
      )}

      {tab === 'tax' && (
        <>
          <div className="adm-card" style={{ padding: 16, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'end' }}>
            <input className="adm-input" placeholder="Tax name" value={form.taxName || ''} onChange={(e) => setForm((f) => ({ ...f, taxName: e.target.value }))} />
            <input className="adm-input" placeholder="Rate %" value={form.taxRate || ''} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} />
            <select className="adm-input" value={form.taxMode || 'exclusive'} onChange={(e) => setForm((f) => ({ ...f, taxMode: e.target.value }))}><option value="exclusive">Exclusive</option><option value="inclusive">Inclusive</option></select>
            <button className="adm-btn adm-btn--primary" onClick={createTaxRate}>Save Tax</button>
          </div>
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Name</th><th>Mode</th><th style={{ textAlign: 'right' }}>Rate</th><th>Status</th></tr></thead><tbody>{taxRates.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.mode}</td><td style={{ textAlign: 'right' }}>{Number(t.rate)}%</td><td>{t.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>
        </>
      )}

      {tab === 'permissions' && (
        <div className="adm-card" style={{ padding: 16 }}>
          {['discount.approve', 'refund.create', 'price.override', 'reports.view', 'cash.drawer', 'inventory.adjust'].map((key) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <input type="checkbox" checked={form[key] === 'true'} onChange={(e) => setForm((f) => ({ ...f, [key]: String(e.target.checked) }))} />
              Staff can {key.replace('.', ' ')}
            </label>
          ))}
          <button className="adm-btn adm-btn--primary" onClick={savePermissions}>Save Staff Permissions</button>
        </div>
      )}

      {tab === 'kitchen' && (
        <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Ticket</th><th>Status</th><th>Note</th><th></th></tr></thead><tbody>{tickets.map((t) => <tr key={t.id}><td style={{ fontWeight: 900 }}>{t.ticketNumber}</td><td>{t.status}</td><td>{t.note || '-'}</td><td><button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => posApi.updateKitchenTicket(t.id, { status: t.status === 'queued' ? 'preparing' : t.status === 'preparing' ? 'ready' : 'completed' }).then(load)}>Advance</button></td></tr>)}</tbody></table></div>
      )}

      {tab === 'terminals' && (
        <>
          <div className="adm-card" style={{ padding: 16, marginBottom: 14, display: 'flex', gap: 8 }}>
            <input className="adm-input" placeholder="Terminal name" value={form.terminalName || ''} onChange={(e) => setForm((f) => ({ ...f, terminalName: e.target.value }))} />
            <input className="adm-input" placeholder="Code" value={form.terminalCode || ''} onChange={(e) => setForm((f) => ({ ...f, terminalCode: e.target.value }))} />
            <input className="adm-input" placeholder="Location" value={form.terminalLocation || ''} onChange={(e) => setForm((f) => ({ ...f, terminalLocation: e.target.value }))} />
            <button className="adm-btn adm-btn--primary" onClick={createTerminal}>Add</button>
          </div>
          <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Name</th><th>Code</th><th>Location</th><th>Status</th></tr></thead><tbody>{terminals.map((t) => <tr key={t.id}><td>{t.name}</td><td>{t.code}</td><td>{t.location || '-'}</td><td>{t.isActive ? 'Active' : 'Inactive'}</td></tr>)}</tbody></table></div>
        </>
      )}
    </div>
  );
}
