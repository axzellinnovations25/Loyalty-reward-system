'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const requireFeature = require('../../middleware/requireFeature');
const { FEATURES } = require('../../config/constants');
const controller = require('./messaging.controller');
const { sendSchema, validateBody } = require('./messaging.validator');

router.use(authenticate, requireFeature(FEATURES.SMS_CAMPAIGNS));

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   validateBody(sendSchema), controller.send);

module.exports = router;
