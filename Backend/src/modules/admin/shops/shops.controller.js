'use strict';

const service = require('./shops.service');
const { ok } = require('../../../utils/apiResponse');

const list    = async (req, res, next) => { try { const { items, meta } = await service.list(req.query); return ok(res, items, meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await service.getById(req.params.id)); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { return ok(res, await service.update(req.params.id, req.body)); } catch (e) { next(e); } };

module.exports = { list, getById, update };
