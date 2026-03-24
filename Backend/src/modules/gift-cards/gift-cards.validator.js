'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
  code: Joi.string().min(4).max(32).optional(),
  initialBalance: Joi.number().positive().required(),
  expiresAt: Joi.date().iso().optional(),
  recipientName: Joi.string().max(100).optional().allow(''),
  recipientPhone: Joi.string().optional().allow(''),
  notes: Joi.string().max(500).optional().allow(''),
});

const redeemSchema = Joi.object({
  code: Joi.string().required(),
  amount: Joi.number().positive().required(),
  customerId: Joi.string().optional(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { createSchema, redeemSchema, validateBody };
