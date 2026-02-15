import { VectorizeClient } from '../infrastructure/vector/vectorize.js';
import { getEmbeddingProvider } from '../infrastructure/embedding/embeddingProvider.js';
import { getLLMProvider } from '../infrastructure/llm/llmProvider.js';
import { conversationService } from './conversationService.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class ChatService {
  constructor() {
    this.vectorize = new VectorizeClient();
    this.embeddingProvider = getEmbeddingProvider();
    this.llmProvider = getLLMProvider();
  }

  async processQuery(question, conversationId = null, language = 'en', chatHistory = []) {
    try {
      logger.info('Processing chat query', { question, conversationId, language });

      if (this.isInappropriateQuestion(question)) {
        return this.getRestrictedResponse(language);
      }

      const questionEmbedding = await this.embeddingProvider.generateEmbedding(question);
      const results = await this.vectorize.query(questionEmbedding, config.search.topK);
      
      logger.info('Vector search completed', { resultsCount: results.length });

      const relevantResults = results.filter(r => r.score >= config.search.similarityThreshold);

      if (relevantResults.length === 0) {
        const noInfoMessage = language === 'id' 
          ? "Saya tidak memiliki informasi tentang itu di portfolio saya."
          : "I don't have information about that in my portfolio.";
        
        return {
          answer: noInfoMessage,
          ...(config.response.showSources && { sources: [] }),
          confidence: 0
        };
      }

      const context = relevantResults.map(r => r.metadata.text).join('\n\n');
      const systemPrompt = this.buildSystemPrompt(language);
      const userPrompt = this.buildUserPrompt(question, context, language);

      // Get history from conversationId or use provided chatHistory
      const history = conversationId 
        ? conversationService.getHistory(conversationId)
        : chatHistory;

      // Build messages with chat history
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6), // Keep last 6 messages (3 exchanges)
        { role: 'user', content: userPrompt }
      ];

      const answer = await this.llmProvider.generateResponse(messages);

      // Save to conversation history if conversationId provided
      if (conversationId) {
        conversationService.addMessage(conversationId, 'user', question);
        conversationService.addMessage(conversationId, 'assistant', answer);
      }

      const avgConfidence = relevantResults.reduce((sum, r) => sum + r.score, 0) / relevantResults.length;

      const response = {
        answer,
        confidence: avgConfidence
      };

      if (config.response.showSources) {
        response.sources = relevantResults.map(r => ({
          text: r.metadata.text.substring(0, 200) + '...',
          source: r.metadata.source,
          score: r.score
        }));
      }

      return response;
    } catch (error) {
      logger.error('Chat query processing failed', error);
      throw error;
    }
  }

  isInappropriateQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    const blockedPatterns = [
      /\b(password|credit card|ssn|social security|bank account|pin|cvv)\b/i,
      /\b(address|phone number|email|personal contact)\b/i,
      /\b(hack|exploit|vulnerability|attack|malware|virus)\b/i,
      /\b(illegal|crime|fraud|scam)\b/i,
      /\b(weather|news|politics|religion|medical advice)\b/i,
      /\b(how to (make|create|build))\b/i,
      /\b(recipe|cooking|food)\b/i,
      /\b(movie|music|game|sport)\b/i,
      /\b(write code|debug|fix|help me with|solve)\b/i,
      /\b(calculate|compute|translate)\b/i
    ];

    return blockedPatterns.some(pattern => pattern.test(lowerQuestion));
  }

  getRestrictedResponse(language) {
    const response = {
      answer: language === 'id' 
        ? "Maaf, saya hanya dapat menjawab pertanyaan profesional saja."
        : "Sorry, I can only answer professional questions only.",
      confidence: 0
    };

    if (config.response.showSources) {
      response.sources = [];
    }

    return response;
  }

  buildSystemPrompt(language) {
    if (language === 'id') {
      return `Anda adalah asisten portfolio profesional. Jawab pertanyaan dengan singkat dan langsung ke intinya.

Aturan:
- Jawab SANGAT SINGKAT (1-2 kalimat maksimal)
- Langsung ke poin, tanpa penjelasan panjang
- Hanya gunakan data dari konteks
- Jangan tambahkan informasi yang tidak ada
- Gunakan riwayat chat untuk memahami konteks percakapan
- Jika tidak tahu, katakan "Tidak ada informasi tentang itu"
- Jawab dalam Bahasa Indonesia`;
    }

    return `You are a professional portfolio assistant. Answer questions briefly and directly to the point.

Rules:
- Answer VERY SHORT (1-2 sentences maximum)
- Get straight to the point, no long explanations
- Only use data from the context
- Don't add information that isn't there
- Use chat history to understand conversation context
- If you don't know, say "No information about that"
- Answer in English`;
  }

  buildUserPrompt(question, context, language) {
    if (language === 'id') {
      return `Data portfolio:
${context}

Pertanyaan: ${question}

Jawab singkat dan langsung (maksimal 2 kalimat).`;
    }

    return `Portfolio data:
${context}

Question: ${question}

Answer briefly and directly (maximum 2 sentences).`;
  }
}
