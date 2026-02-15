import express from 'express';
import { conversationService } from '../services/conversationService.js';

const router = express.Router();

/**
 * Get conversation history
 */
router.get('/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  const history = conversationService.getHistory(conversationId);
  res.json({ conversationId, history });
});

/**
 * Clear conversation history
 */
router.delete('/:conversationId', (req, res) => {
  const { conversationId } = req.params;
  conversationService.clearConversation(conversationId);
  res.json({ success: true, message: 'Conversation cleared' });
});

/**
 * Get active conversations count
 */
router.get('/', (req, res) => {
  const count = conversationService.getActiveCount();
  res.json({ activeConversations: count });
});

export default router;
