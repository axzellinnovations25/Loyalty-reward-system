'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./auth.controller');
const { loginSchema, registerSchema, changePasswordSchema, validateBody } = require('./auth.validator');

router.post('/login',    validateBody(loginSchema),    controller.login);
router.post('/register', validateBody(registerSchema), controller.register);
router.get('/me',        authenticate,                 controller.me);
router.post('/change-password', authenticate, validateBody(changePasswordSchema), controller.changePassword);

module.exports = router;
