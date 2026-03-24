'use strict';

const Joi = require('joi');

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  isActive: Joi.boolean(),
  notes: Joi.string().max(500).allow(''),
}).min(1);

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { updateSchema, validateBody };
