'use strict';

const service = require('./pos.service');
const { ok, created } = require('../../utils/apiResponse');

const wrap = (fn) => async (req, res, next) => {
  try { return await fn(req, res); } catch (e) { next(e); }
};

module.exports = {
  listPayments: wrap(async (req, res) => { const { items, meta } = await service.listPayments(req.shopId, req.query); return ok(res, items, meta); }),
  listReceipts: wrap(async (req, res) => { const { items, meta } = await service.listReceipts(req.shopId, req.query); return ok(res, items, meta); }),
  reprintReceipt: wrap(async (req, res) => ok(res, await service.reprintReceipt(req.shopId, req.params.id, req.user.userId, req.body.terminalId))),
  listRefunds: wrap(async (req, res) => { const { items, meta } = await service.listRefunds(req.shopId, req.query); return ok(res, items, meta); }),
  createRefund: wrap(async (req, res) => created(res, await service.createRefund(req.shopId, req.user.userId, req.body))),
  openShift: wrap(async (req, res) => created(res, await service.openShift(req.shopId, req.user.userId, req.body))),
  currentShift: wrap(async (req, res) => ok(res, await service.currentShift(req.shopId, req.user.userId))),
  listShifts: wrap(async (req, res) => { const { items, meta } = await service.listShifts(req.shopId, req.query); return ok(res, items, meta); }),
  cashEvent: wrap(async (req, res) => ok(res, await service.cashEvent(req.shopId, req.user.userId, req.params.id, req.body))),
  closeShift: wrap(async (req, res) => ok(res, await service.closeShift(req.shopId, req.user.userId, req.params.id, req.body))),
  listStockMovements: wrap(async (req, res) => { const { items, meta } = await service.listStockMovements(req.shopId, req.query); return ok(res, items, meta); }),
  adjustStock: wrap(async (req, res) => created(res, await service.adjustStock(req.shopId, req.user.userId, req.body))),
  listSuppliers: wrap(async (req, res) => ok(res, await service.listSuppliers(req.shopId))),
  createSupplier: wrap(async (req, res) => created(res, await service.createSupplier(req.shopId, req.body))),
  updateSupplier: wrap(async (req, res) => ok(res, await service.updateSupplier(req.shopId, req.params.id, req.body))),
  listPurchaseOrders: wrap(async (req, res) => { const { items, meta } = await service.listPurchaseOrders(req.shopId, req.query); return ok(res, items, meta); }),
  createPurchaseOrder: wrap(async (req, res) => created(res, await service.createPurchaseOrder(req.shopId, req.body))),
  receivePurchaseOrder: wrap(async (req, res) => ok(res, await service.receivePurchaseOrder(req.shopId, req.user.userId, req.params.id, req.body))),
  listTaxRates: wrap(async (req, res) => ok(res, await service.listTaxRates(req.shopId))),
  createTaxRate: wrap(async (req, res) => created(res, await service.saveTaxRate(req.shopId, req.body))),
  updateTaxRate: wrap(async (req, res) => ok(res, await service.saveTaxRate(req.shopId, req.body, req.params.id))),
  listHeldOrders: wrap(async (req, res) => ok(res, await service.listHeldOrders(req.shopId, req.query))),
  createHeldOrder: wrap(async (req, res) => created(res, await service.createHeldOrder(req.shopId, req.user.userId, req.body))),
  updateHeldOrder: wrap(async (req, res) => ok(res, await service.updateHeldOrder(req.shopId, req.params.id, req.body))),
  listVariants: wrap(async (req, res) => ok(res, await service.listVariants(req.shopId, req.params.productId))),
  createVariant: wrap(async (req, res) => created(res, await service.createVariant(req.shopId, req.params.productId, req.body))),
  listModifierGroups: wrap(async (req, res) => ok(res, await service.listModifierGroups(req.shopId, req.params.productId))),
  createModifierGroup: wrap(async (req, res) => created(res, await service.createModifierGroup(req.shopId, req.params.productId, req.body))),
  listPermissions: wrap(async (req, res) => ok(res, await service.listPermissions(req.shopId))),
  setPermissions: wrap(async (req, res) => ok(res, await service.setPermissions(req.shopId, req.body))),
  listKitchenTickets: wrap(async (req, res) => ok(res, await service.listKitchenTickets(req.shopId, req.query))),
  createKitchenTicket: wrap(async (req, res) => created(res, await service.createKitchenTicket(req.shopId, req.user.userId, req.body))),
  updateKitchenTicket: wrap(async (req, res) => ok(res, await service.updateKitchenTicket(req.shopId, req.params.id, req.body))),
  listTerminals: wrap(async (req, res) => ok(res, await service.listTerminals(req.shopId))),
  createTerminal: wrap(async (req, res) => created(res, await service.createTerminal(req.shopId, req.body))),
  professionalReport: wrap(async (req, res) => ok(res, await service.professionalReport(req.shopId, req.query, req.user.userId))),
};
