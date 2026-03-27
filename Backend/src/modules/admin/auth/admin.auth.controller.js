'use strict';

const service = require('./admin.auth.service');
const { ok }  = require('../../../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const data = await service.login(req.body);
    return ok(res, data);
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const data = await service.me(req.admin.adminId);
    return ok(res, data);
  } catch (err) { next(err); }
};

module.exports = { login, me };
