'use strict';

const Joi = require('joi');

const createSchema = Joi.object({
  customerId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  reference: Joi.string().max(100).optional().allow(''),
  notes: Joi.string().max(500).optional().allow(''),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { createSchema, validateBody };
