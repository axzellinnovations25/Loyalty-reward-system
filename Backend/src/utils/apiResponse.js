'use strict';

const ok = (res, data = null, meta = null) =>
  res.status(200).json({ success: true, data, ...(meta && { meta }) });

const created = (res, data = null) =>
  res.status(201).json({ success: true, data });

const noContent = (res) =>
  res.status(204).send();

const badRequest = (res, message = 'Bad request', errors = null) =>
  res.status(400).json({ success: false, error: message, ...(errors && { errors }) });

const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, error: message });

const forbidden = (res, message = 'Forbidden') =>
  res.status(403).json({ success: false, error: message });

const notFound = (res, message = 'Not found') =>
  res.status(404).json({ success: false, error: message });

const conflict = (res, message = 'Conflict') =>
  res.status(409).json({ success: false, error: message });

const serverError = (res, message = 'Internal server error') =>
  res.status(500).json({ success: false, error: message });

module.exports = { ok, created, noContent, badRequest, unauthorized, forbidden, notFound, conflict, serverError };
