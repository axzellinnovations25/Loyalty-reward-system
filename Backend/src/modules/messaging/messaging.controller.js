'use strict';

const service = require('./messaging.service');
const { ok, created } = require('../../utils/apiResponse');

const list    = async (req, res, next) => { try { const { items, meta } = await service.list(req.shopId, req.query); return ok(res, items, meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await service.getById(req.shopId, req.params.id)); } catch (e) { next(e); } };
const send    = async (req, res, next) => { try { return created(res, await service.send(req.shopId, req.body)); } catch (e) { next(e); } };

module.exports = { list, getById, send };
