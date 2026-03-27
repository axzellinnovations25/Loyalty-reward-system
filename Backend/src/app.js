'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Module routers
const authRouter       = require('./modules/auth/auth.router');
const customersRouter  = require('./modules/customers/customers.router');
const purchasesRouter  = require('./modules/purchases/purchases.router');
const redemptionsRouter = require('./modules/redemptions/redemptions.router');
const giftCardsRouter  = require('./modules/gift-cards/gift-cards.router');
const rewardsRouter    = require('./modules/rewards/rewards.router');
const messagingRouter  = require('./modules/messaging/messaging.router');
const reportsRouter    = require('./modules/reports/reports.router');
const settingsRouter   = require('./modules/settings/settings.router');

// Admin routers
const adminAuthRouter    = require('./modules/admin/auth/admin.auth.router');
const adminShopsRouter   = require('./modules/admin/shops/shops.router');
const adminUsersRouter   = require('./modules/admin/users/users.router');
const adminPlansRouter   = require('./modules/admin/plans/plans.router');
const adminBillingRouter = require('./modules/admin/billing/billing.router');

const app = express();

// Security & parsing
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Shop routes
app.use('/api/auth',        authRouter);
app.use('/api/customers',   customersRouter);
app.use('/api/purchases',   purchasesRouter);
app.use('/api/redemptions', redemptionsRouter);
app.use('/api/gift-cards',  giftCardsRouter);
app.use('/api/rewards',     rewardsRouter);
app.use('/api/messaging',   messagingRouter);
app.use('/api/reports',     reportsRouter);
app.use('/api/settings',    settingsRouter);

// Admin routes
app.use('/api/admin/auth',    adminAuthRouter);
app.use('/api/admin/shops',   adminShopsRouter);
app.use('/api/admin/users',   adminUsersRouter);
app.use('/api/admin/plans',   adminPlansRouter);
app.use('/api/admin/billing', adminBillingRouter);

// 404
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
