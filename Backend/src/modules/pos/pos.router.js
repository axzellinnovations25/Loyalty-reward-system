'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./pos.controller');

router.use(authenticate);

router.get('/payments', controller.listPayments);
router.get('/receipts', controller.listReceipts);
router.post('/receipts/:id/reprint', controller.reprintReceipt);

router.get('/refunds', controller.listRefunds);
router.post('/refunds', controller.createRefund);

router.get('/shifts', controller.listShifts);
router.get('/shifts/current', controller.currentShift);
router.post('/shifts/open', controller.openShift);
router.post('/shifts/:id/cash-events', controller.cashEvent);
router.post('/shifts/:id/close', controller.closeShift);

router.get('/stock-movements', controller.listStockMovements);
router.post('/stock-adjustments', controller.adjustStock);

router.get('/suppliers', controller.listSuppliers);
router.post('/suppliers', controller.createSupplier);
router.put('/suppliers/:id', controller.updateSupplier);

router.get('/purchase-orders', controller.listPurchaseOrders);
router.post('/purchase-orders', controller.createPurchaseOrder);
router.post('/purchase-orders/:id/receive', controller.receivePurchaseOrder);

router.get('/tax-rates', controller.listTaxRates);
router.post('/tax-rates', controller.createTaxRate);
router.put('/tax-rates/:id', controller.updateTaxRate);

router.get('/held-orders', controller.listHeldOrders);
router.post('/held-orders', controller.createHeldOrder);
router.put('/held-orders/:id', controller.updateHeldOrder);

router.get('/products/:productId/variants', controller.listVariants);
router.post('/products/:productId/variants', controller.createVariant);
router.get('/products/:productId/modifier-groups', controller.listModifierGroups);
router.post('/products/:productId/modifier-groups', controller.createModifierGroup);

router.get('/permissions', controller.listPermissions);
router.put('/permissions', controller.setPermissions);

router.get('/kitchen-tickets', controller.listKitchenTickets);
router.post('/kitchen-tickets', controller.createKitchenTicket);
router.put('/kitchen-tickets/:id', controller.updateKitchenTicket);

router.get('/terminals', controller.listTerminals);
router.post('/terminals', controller.createTerminal);

router.get('/reports/professional', controller.professionalReport);

module.exports = router;
