'use strict';

const service = require('./users.service');
const { ok, created, noContent } = require('../../utils/apiResponse');

const list = async (req, res, next) => {
  try {
    return ok(res, await service.list(req.shopId, req.user.userId));
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    return created(res, await service.create(req.shopId, req.user.userId, req.body));
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    return ok(res, await service.update(req.shopId, req.user.userId, req.params.id, req.body));
  } catch (e) {
    next(e);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await service.resetPassword(req.shopId, req.user.userId, req.params.id, req.body);
    return noContent(res);
  } catch (e) {
    next(e);
  }
};

const deactivate = async (req, res, next) => {
  try {
    await service.deactivate(req.shopId, req.user.userId, req.params.id);
    return noContent(res);
  } catch (e) {
    next(e);
  }
};

module.exports = { list, create, update, resetPassword, deactivate };

