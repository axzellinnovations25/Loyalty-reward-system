'use strict';

const logger = require('../utils/logger');

/**
 * In production, loads secrets from AWS Secrets Manager and injects them
 * into process.env. In development, dotenv already populated process.env.
 */
async function loadSecrets() {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Skipping AWS Secrets Manager in non-production environment');
    return;
  }

  const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });

  const secretName = process.env.AWS_SECRET_NAME;
  if (!secretName) throw new Error('AWS_SECRET_NAME env var is required in production');

  logger.info('Loading secrets from AWS Secrets Manager', { secretName });

  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
  const secrets = JSON.parse(response.SecretString);

  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value;
  }

  logger.info('Secrets loaded successfully');
}

module.exports = { loadSecrets };
