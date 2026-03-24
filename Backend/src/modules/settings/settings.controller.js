'use strict';

const service = require('./settings.service');
const { ok } = require('../../utils/apiResponse');

const get    = async (req, res, next) => { try { return ok(res, await service.get(req.shopId)); } catch (e) { next(e); } };
const update = async (req, res, next) => { try { return ok(res, await service.update(req.shopId, req.body)); } catch (e) { next(e); } };

module.exports = { get, update };
