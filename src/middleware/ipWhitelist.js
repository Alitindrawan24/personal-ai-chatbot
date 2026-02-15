import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const ipWhitelist = (req, res, next) => {
  if (!config.ipWhitelist || config.ipWhitelist.length === 0) {
    return next();
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (config.ipWhitelist.includes(clientIp)) {
    return next();
  }

  logger.warn(`Blocked request from non-whitelisted IP: ${clientIp}`);
  return res.status(403).json({ error: 'Access denied' });
};
