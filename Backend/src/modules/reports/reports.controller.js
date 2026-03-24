'use strict';

const service = require('./reports.service');
const { ok } = require('../../utils/apiResponse');

const summary        = async (req, res, next) => { try { return ok(res, await service.summary(req.shopId, req.query)); } catch (e) { next(e); } };
const topCustomers   = async (req, res, next) => { try { return ok(res, await service.topCustomers(req.shopId, req.query)); } catch (e) { next(e); } };
const purchasesByDay = async (req, res, next) => { try { return ok(res, await service.purchasesByDay(req.shopId, req.query)); } catch (e) { next(e); } };

module.exports = { summary, topCustomers, purchasesByDay };
