'use strict';

const Joi = require('joi');

const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;

const baseSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  description: Joi.string().max(500).optional().allow('', null),
  kind: Joi.string()
    .valid('cart_percent', 'cart_amount', 'item_percent', 'item_amount', 'bogo', 'happy_hour_price')
    .required(),
  isActive: Joi.boolean().optional(),
  priority: Joi.number().integer().min(1).max(10000).optional(),
  stackable: Joi.boolean().optional(),
  startAt: Joi.date().iso().optional().allow(null),
  endAt: Joi.date().iso().optional().allow(null),
  daysOfWeek: Joi.array().items(Joi.number().integer().min(0).max(6)).optional(),
  startTime: Joi.string().pattern(timeRe).optional().allow(null, ''),
  endTime: Joi.string().pattern(timeRe).optional().allow(null, ''),
  couponCode: Joi.string().max(50).optional().allow(null, '').custom((v) => (v ? String(v).trim().toUpperCase() : null)),
  usageLimit: Joi.number().integer().min(1).optional().allow(null),
  perCustomerLimit: Joi.number().integer().min(1).optional().allow(null),
  config: Joi.object().required(),
});

const createSchema = baseSchema;
const updateSchema = baseSchema.fork(['name', 'kind', 'config'], (s) => s.optional());

const cartItemSchema = Joi.object({
  productId: Joi.string().uuid().optional().allow(null),
  name: Joi.string().min(1).max(150).required(),
  sku: Joi.string().max(64).optional().allow(null, ''),
  unitPrice: Joi.number().precision(2).min(0).required(),
  quantity: Joi.number().integer().min(1).required(),
});

const previewSchema = Joi.object({
  customerId: Joi.string().uuid().optional().allow(null),
  couponCode: Joi.string().max(50).optional().allow('', null).custom((v) => (v ? String(v).trim().toUpperCase() : null)),
  at: Joi.date().iso().optional(),
  items: Joi.array().items(cartItemSchema).min(1).required(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        errors: error.details.map((d) => d.message),
      });
    }
    req.body = value;
    next();
  };
}

module.exports = { createSchema, updateSchema, previewSchema, validateBody };

