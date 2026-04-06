'use strict';

const router             = require('express').Router();
const controller         = require('./admin.auth.controller');
const authenticateAdmin  = require('../../../middleware/authenticateAdmin');
const { loginSchema, validateBody } = require('./admin.auth.validator');

// POST /api/admin/auth/login  — public
router.post('/login', validateBody(loginSchema), controller.login);

// GET  /api/admin/auth/me     — protected
router.get('/me', authenticateAdmin, controller.me);

module.exports = router;
