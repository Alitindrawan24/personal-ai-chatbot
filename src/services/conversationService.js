/**
 * In-memory conversation storage
 * For production, use Redis, MongoDB, or DynamoDB
 */
class ConversationService {
  constructor() {
    this.conversations = new Map();
    this.maxHistoryLength = 6; // Keep last 6 messages (3 exchanges)
    this.ttl = 3600000; // 1 hour TTL
  }

  /**
   * Get conversation history
   */
  getHistory(conversationId) {
    if (!conversationId) return [];
    
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];
    
    // Check if expired
    if (Date.now() - conversation.lastAccess > this.ttl) {
      this.conversations.delete(conversationId);
      return [];
    }
    
    return conversation.messages;
  }

  /**
   * Add message to conversation
   */
  addMessage(conversationId, role, content) {
    if (!conversationId) return;
    
    let conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      conversation = {
        messages: [],
        lastAccess: Date.now()
      };
      this.conversations.set(conversationId, conversation);
    }
    
    conversation.messages.push({ role, content });
    conversation.lastAccess = Date.now();
    
    // Keep only last N messages
    if (conversation.messages.length > this.maxHistoryLength) {
      conversation.messages = conversation.messages.slice(-this.maxHistoryLength);
    }
  }

  /**
   * Clear conversation
   */
  clearConversation(conversationId) {
    if (conversationId) {
      this.conversations.delete(conversationId);
    }
  }

  /**
   * Get all active conversations count
   */
  getActiveCount() {
    return this.conversations.size;
  }

  /**
   * Cleanup expired conversations
   */
  cleanup() {
    const now = Date.now();
    for (const [id, conversation] of this.conversations.entries()) {
      if (now - conversation.lastAccess > this.ttl) {
        this.conversations.delete(id);
      }
    }
  }
}

// Singleton instance
export const conversationService = new ConversationService();

// Cleanup expired conversations every 10 minutes
setInterval(() => conversationService.cleanup(), 600000);
