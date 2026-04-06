'use strict';

const router = require('express').Router();
const authenticateAdmin = require('../../../middleware/authenticateAdmin');
const controller = require('./plans.controller');

router.use(authenticateAdmin);

router.get('/',    controller.list);
router.get('/:id', controller.getById);
router.post('/',   controller.create);
router.put('/:id', controller.update);

module.exports = router;
