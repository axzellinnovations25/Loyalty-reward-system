'use strict';

const router = require('express').Router();
const authenticate = require('../../../middleware/authenticate');
const requireAdmin = require('../../../middleware/requireAdmin');
const controller = require('./plans.controller');

router.use(authenticate, requireAdmin);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   controller.create);
router.put('/:id', controller.update);

module.exports = router;
