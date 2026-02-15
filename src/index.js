import express from 'express';
import { config } from './config/env.js';
import { ipWhitelist } from './middleware/ipWhitelist.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(ipWhitelist);
app.use(apiKeyAuth);
app.use(rateLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/documents', documentRoutes);
app.use('/api', chatRoutes);
app.use('/api/conversations', conversationRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`, { env: config.nodeEnv });
});
