import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const apiKeyAuth = (req, res, next) => {
  if (!config.apiKey) {
    return next();
  }

  const providedKey = req.headers['x-api-key'];
  
  if (providedKey === config.apiKey) {
    return next();
  }

  logger.warn(`Unauthorized request - invalid or missing API key`);
  return res.status(401).json({ error: 'Unauthorized' });
};
