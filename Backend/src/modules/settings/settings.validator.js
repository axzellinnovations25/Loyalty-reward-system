'use strict';

const Joi = require('joi');

const updateSchema = Joi.object({
  pointsPerAmount:     Joi.number().positive(),
  redemptionValue:     Joi.number().positive(),
  minRedeemPoints:     Joi.number().integer().min(0),
  maxRedeemMode:       Joi.string().valid('flat_amount', 'percent_of_bill'),
  pointsExpiryMonths:  Joi.number().integer().min(0),
  expiryWarningDays:   Joi.number().integer().min(0),
}).min(1);

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, error: 'Validation error', errors: error.details.map(d => d.message) });
    next();
  };
}

module.exports = { updateSchema, validateBody };
