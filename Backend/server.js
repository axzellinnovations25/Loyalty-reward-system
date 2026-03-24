'use strict';

require('dotenv').config();

const { loadSecrets } = require('./src/config/secrets');
const logger = require('./src/utils/logger');

async function bootstrap() {
  try {
    await loadSecrets();

    const app = require('./src/app');
    const { startJobs } = require('./src/jobs');

    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV || 'development' });
    });

    startJobs();

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => process.exit(0));
    });
  } catch (err) {
    logger.error('Failed to bootstrap server', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();
