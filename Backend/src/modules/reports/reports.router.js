'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const requireFeature = require('../../middleware/requireFeature');
const { FEATURES } = require('../../config/constants');
const controller = require('./reports.controller');

router.use(authenticate);

router.get('/summary',          controller.summary);
router.get('/top-customers',    requireFeature(FEATURES.ADVANCED_REPORTS), controller.topCustomers);
router.get('/purchases-by-day', requireFeature(FEATURES.ADVANCED_REPORTS), controller.purchasesByDay);

module.exports = router;
