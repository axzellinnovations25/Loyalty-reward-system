'use strict';

const Joi = require('joi');

const sendSchema = Joi.object({
  message: Joi.string().min(1).max(160).required(),
  recipientType: Joi.string().valid('all', 'segment', 'individual').required(),
  customerIds: Joi.when('recipientType', {
    is: 'individual',
    then: Joi.array().items(Joi.string()).min(1).required(),
    otherwise: Joi.forbidden(),
  }),
  segment: Joi.when('recipientType', {
    is: 'segment',
    then: Joi.string().valid('active', 'inactive', 'top_spenders').required(),
    otherwise: Joi.forbidden(),
  }),
  scheduledAt: Joi.date().iso().min('now').optional(),
});

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { sendSchema, validateBody };
