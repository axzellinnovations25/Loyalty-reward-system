'use strict';

const service = require('./plans.service');
const { ok, created } = require('../../../utils/apiResponse');

const list    = async (req, res, next) => { try { return ok(res, await service.list()); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await service.getById(req.params.id)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { return created(res, await service.create(req.body)); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { return ok(res, await service.update(req.params.id, req.body)); } catch (e) { next(e); } };

module.exports = { list, getById, create, update };
