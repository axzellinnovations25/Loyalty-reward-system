'use strict';

const service = require('./billing.service');
const { ok, created } = require('../../../utils/apiResponse');

const list       = async (req, res, next) => { try { const { items, meta } = await service.list(req.query); return ok(res, items, meta); } catch (e) { next(e); } };
const getById    = async (req, res, next) => { try { return ok(res, await service.getById(req.params.id)); } catch (e) { next(e); } };
const create     = async (req, res, next) => { try { return created(res, await service.create(req.body)); } catch (e) { next(e); } };
const assignPlan = async (req, res, next) => { try { return ok(res, await service.assignPlan(req.params.shopId, req.body)); } catch (e) { next(e); } };

module.exports = { list, getById, create, assignPlan };
