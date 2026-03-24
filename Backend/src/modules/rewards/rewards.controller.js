'use strict';

const service = require('./rewards.service');
const { ok, created, noContent } = require('../../utils/apiResponse');

const list    = async (req, res, next) => { try { const { items, meta } = await service.list(req.shopId, req.query); return ok(res, items, meta); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await service.getById(req.shopId, req.params.id)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { return created(res, await service.create(req.shopId, req.body)); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { return ok(res, await service.update(req.shopId, req.params.id, req.body)); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { await service.remove(req.shopId, req.params.id); return noContent(res); } catch (e) { next(e); } };

module.exports = { list, getById, create, update, remove };
