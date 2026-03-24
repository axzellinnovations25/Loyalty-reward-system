'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./auth.controller');
const { loginSchema, registerSchema, validateBody } = require('./auth.validator');

router.post('/login',    validateBody(loginSchema),    controller.login);
router.post('/register', validateBody(registerSchema), controller.register);
router.get('/me',        authenticate,                 controller.me);

module.exports = router;
