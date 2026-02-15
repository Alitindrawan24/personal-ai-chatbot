import OpenAI from 'openai';
import { config } from '../../config/env.js';

/**
 * Abstract embedding provider
 */
class EmbeddingProvider {
  async generateEmbedding(text) {
    throw new Error('Not implemented');
  }

  async generateEmbeddings(texts) {
    throw new Error('Not implemented');
  }
}

/**
 * OpenAI embedding provider
 */
class OpenAIEmbeddingProvider extends EmbeddingProvider {
  constructor() {
    super();
    this.client = new OpenAI({ apiKey: config.llm.openaiApiKey });
    this.model = config.embedding.model;
  }

  async generateEmbedding(text) {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text
    });
    return response.data[0].embedding;
  }

  async generateEmbeddings(texts) {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts
    });
    return response.data.map(item => item.embedding);
  }
}

/**
 * Cloudflare Workers AI embedding provider
 */
class CloudflareEmbeddingProvider extends EmbeddingProvider {
  constructor() {
    super();
    this.accountId = config.cloudflare.accountId;
    this.apiToken = config.cloudflare.apiToken;
  }

  async generateEmbedding(text) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/baai/bge-base-en-v1.5`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare embedding failed: ${await response.text()}`);
    }

    const data = await response.json();
    return data.result.data[0];
  }

  async generateEmbeddings(texts) {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }
}

/**
 * Factory function to get embedding provider
 * Note: Google AI Studio doesn't have embeddings, so we use OpenAI embeddings
 */
export function getEmbeddingProvider() {
  // For Google LLM, use OpenAI embeddings (requires OpenAI API key)
  if (config.llm.provider === 'google') {
    return new OpenAIEmbeddingProvider();
  }
  if (config.llm.provider === 'cloudflare') {
    return new CloudflareEmbeddingProvider();
  }
  return new OpenAIEmbeddingProvider();
}
