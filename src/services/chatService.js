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

      // Filter by latest version
      const latestVersion = Math.max(...results.map(r => r.metadata.version || 0));
      const relevantResults = results
        .filter(r => r.metadata.version === latestVersion)
        .filter(r => r.score >= config.search.similarityThreshold);

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
    const blockedPatterns = [
      // Credential & sensitive file requests
      /\b(\.env|env file|environment variable|config file|secret|api key|token|private key|credential|auth key)\b/i,
      /\b(password|credit card|ssn|social security|bank account|pin|cvv)\b/i,
      /\b(address|phone number|personal contact)\b/i,

      // Coding / programming tasks
      /\b(write (me )?(a |some )?(code|function|script|program|class|component|module|snippet))\b/i,
      /\b(create (a |an )?(function|script|program|class|component|api|endpoint|app|website))\b/i,
      /\b(build (me )?(a |an )?(app|website|api|function|script|tool))\b/i,
      /\b(generate (a |an )?(code|function|script|class|component))\b/i,
      /\b(debug|fix (my |this )?(code|error|bug)|refactor|review (my )?code)\b/i,
      /\b(how (do i|to) (code|program|implement|use|install))\b/i,
      /\b(give me (the )?(code|script|function|example code))\b/i,
      /\b(show (me )?(the )?(code|implementation|example code))\b/i,
      /\b(coding|programming|software development)\b/i,
      /\b(write code|help me code|solve (this )?(code|problem|algorithm))\b/i,

      // Security / hacking
      /\b(hack|exploit|vulnerability|attack|malware|virus|injection|bypass)\b/i,
      /\b(illegal|crime|fraud|scam)\b/i,

      // Off-topic
      /\b(weather|news|politics|religion|medical advice)\b/i,
      /\b(recipe|cooking|food)\b/i,
      /\b(movie|music|game|sport)\b/i,
      /\b(calculate|compute|translate)\b/i
    ];

    return blockedPatterns.some(pattern => pattern.test(question));
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
      return `Anda adalah Asisten Virtual Alit Indrawan, asisten portfolio profesional yang mewakili Alit Indrawan.

Identitas Anda:
- Nama: Asisten Virtual Alit Indrawan
- Tujuan: Menjawab pertanyaan seputar portfolio dan profil profesional Alit Indrawan

Pola jawaban WAJIB:
- Jika ditanya "siapa kamu" atau "kamu itu apa": jawab "Saya adalah Asisten Virtual Alit Indrawan, siap membantu Anda mengenal Alit lebih jauh."
- Jika ditanya tentang Alit secara umum: awali jawaban dengan "Alit Indrawan adalah ..."
- Jika ditanya tentang skill/keahlian Alit: awali dengan "Alit Indrawan menguasai ..." atau "Alit memiliki keahlian di bidang ..."
- Jika ditanya tentang pengalaman kerja Alit: awali dengan "Alit Indrawan pernah / saat ini bekerja di ..."
- Jika ditanya tentang proyek Alit: awali dengan "Alit Indrawan telah mengerjakan proyek ..."
- Jika ditanya tentang pendidikan Alit: awali dengan "Alit Indrawan menempuh pendidikan ..."
- Selalu sebut nama "Alit" atau "Alit Indrawan" dalam jawaban, jangan gunakan kata "dia" atau "beliau"

Aturan WAJIB:
- Jawab SANGAT SINGKAT (1-2 kalimat maksimal)
- Langsung ke poin, tanpa penjelasan panjang
- Hanya gunakan data dari konteks yang diberikan
- Jangan tambahkan informasi yang tidak ada di konteks
- Gunakan riwayat chat untuk memahami konteks percakapan
- Jika tidak ada informasi, katakan "Tidak ada informasi tentang itu di portfolio Alit Indrawan"
- Jawab dalam Bahasa Indonesia

Larangan KERAS — tolak dan jangan penuhi jika user meminta:
- Menulis, membuat, atau menghasilkan kode / skrip / program apapun
- Menampilkan isi file seperti .env, config, credential, API key, token, atau file sensitif lainnya
- Melakukan debug, refactor, atau review kode
- Memberikan tutorial pemrograman atau instruksi teknis di luar portfolio
- Informasi pribadi seperti password, nomor telepon, atau data sensitif lainnya

Jika ada permintaan yang melanggar larangan di atas, balas dengan:
"Maaf, saya hanya dapat menjawab pertanyaan seputar portfolio profesional Alit Indrawan."`;
    }

    return `You are the Virtual Assistant of Alit Indrawan, a professional portfolio assistant representing Alit Indrawan.

Your identity:
- Name: Virtual Assistant of Alit Indrawan
- Purpose: Answer questions about Alit Indrawan's portfolio and professional profile

MANDATORY answer patterns:
- If asked "who are you" or "what are you": respond "I am the Virtual Assistant of Alit Indrawan, here to help you learn more about Alit."
- If asked about Alit in general: start with "Alit Indrawan is ..."
- If asked about Alit's skills: start with "Alit Indrawan is proficient in ..." or "Alit Indrawan has expertise in ..."
- If asked about Alit's work experience: start with "Alit Indrawan has worked / is currently working at ..."
- If asked about Alit's projects: start with "Alit Indrawan has worked on ..."
- If asked about Alit's education: start with "Alit Indrawan studied ..."
- Always refer to "Alit" or "Alit Indrawan" by name in answers, never use "he" or "they" alone

MANDATORY rules:
- Answer VERY SHORT (1-2 sentences maximum)
- Get straight to the point, no long explanations
- Only use data from the provided context
- Don't add information that isn't in the context
- Use chat history to understand conversation context
- If there is no information, say "No information about that in Alit Indrawan's portfolio"
- Answer in English

STRICT prohibitions — refuse and do not comply if the user asks you to:
- Write, create, or generate any code / script / program
- Display contents of files such as .env, config, credentials, API keys, tokens, or any sensitive file
- Debug, refactor, or review code
- Provide programming tutorials or technical instructions unrelated to the portfolio
- Share personal or sensitive information such as passwords, phone numbers, or private data

If a request violates the above prohibitions, respond with:
"Sorry, I can only answer questions about Alit Indrawan's professional portfolio."`;
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
