import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    vectorizeIndexName: process.env.VECTORIZE_INDEX_NAME,
    aiGatewayUrl: process.env.CF_AI_GATEWAY_URL
  },
  
  llm: {
    provider: process.env.LLM_PROVIDER || 'openai',
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    googleApiKey: process.env.GOOGLE_API_KEY,
    googleModel: process.env.GOOGLE_MODEL || 'gemini-1.5-flash'
  },
  
  embedding: {
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS) || 768,
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 500,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 50
  },
  
  search: {
    topK: parseInt(process.env.TOP_K_RESULTS) || 5,
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.7
  },
  
  response: {
    showSources: process.env.SHOW_SOURCES !== 'false'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 20
  },
  
  ipWhitelist: process.env.IP_WHITELIST ? process.env.IP_WHITELIST.split(',').map(ip => ip.trim()) : [],
  
  apiKey: process.env.API_KEY
};
