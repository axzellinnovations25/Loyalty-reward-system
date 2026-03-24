'use strict';

const Joi = require('joi');

const updateSchema = Joi.object({
  pointsPerCurrencyUnit: Joi.number().positive(),
  pointsExpiryDays: Joi.number().integer().min(0),
  smsSenderId: Joi.string().min(3).max(11),
  smsApiKey: Joi.string().min(8),
  welcomeMessage: Joi.string().max(160).allow(''),
  birthdayMessage: Joi.string().max(160).allow(''),
  timezone: Joi.string(),
}).min(1);

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { updateSchema, validateBody };
