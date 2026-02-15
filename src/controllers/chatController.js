import { ChatService } from '../services/chatService.js';
import { chatQuerySchema } from '../utils/validators.js';

const chatService = new ChatService();

/**
 * Chat query endpoint
 */
export async function chat(req, res, next) {
  try {
    const validated = chatQuerySchema.parse(req.body);
    
    const result = await chatService.processQuery(
      validated.question,
      validated.conversationId,
      validated.language,
      validated.chatHistory
    );
    
    res.json(result);
  } catch (error) {
    next(error);
  }
}
