'use strict';

const router = require('express').Router();
const authenticate = require('../../../middleware/authenticate');
const requireAdmin = require('../../../middleware/requireAdmin');
const controller = require('./billing.controller');

router.use(authenticate, requireAdmin);

router.get('/',                      controller.list);
router.get('/:id',                   controller.getById);
router.post('/',                     controller.create);
router.post('/shops/:shopId/plan',   controller.assignPlan);

module.exports = router;
