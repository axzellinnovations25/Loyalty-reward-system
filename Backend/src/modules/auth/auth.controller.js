'use strict';

const service = require('./auth.service');
const { ok, created } = require('../../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const data = await service.login(req.body);
    return ok(res, data);
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const data = await service.register(req.body);
    return created(res, data);
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const data = await service.me(req.user.userId);
    return ok(res, data);
  } catch (err) { next(err); }
};

module.exports = { login, register, me };
