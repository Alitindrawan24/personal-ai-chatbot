import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config/env.js';

/**
 * Abstract LLM provider
 */
class LLMProvider {
  async generateResponse(messages) {
    throw new Error('Not implemented');
  }
}

/**
 * OpenAI LLM provider
 */
class OpenAILLMProvider extends LLMProvider {
  constructor() {
    super();
    this.client = new OpenAI({ apiKey: config.llm.openaiApiKey });
    this.model = config.llm.openaiModel;
  }

  async generateResponse(messages) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 500
    });
    return response.choices[0].message.content;
  }
}

/**
 * Google AI Studio (Gemini) LLM provider
 */
class GoogleLLMProvider extends LLMProvider {
  constructor() {
    super();
    this.client = new GoogleGenerativeAI(config.llm.googleApiKey);
    this.model = this.client.getGenerativeModel({ model: config.llm.googleModel });
  }

  async generateResponse(messages) {
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const userPrompt = messages.find(m => m.role === 'user')?.content || '';
    
    const prompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}

/**
 * Cloudflare Workers AI LLM provider
 */
class CloudflareLLMProvider extends LLMProvider {
  constructor() {
    super();
    this.accountId = config.cloudflare.accountId;
    this.apiToken = config.cloudflare.apiToken;
  }

  async generateResponse(messages) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/ai/run/@cf/meta/llama-2-7b-chat-int8`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare LLM failed: ${await response.text()}`);
    }

    const data = await response.json();
    return data.result.response;
  }
}

/**
 * Factory function to get LLM provider
 */
export function getLLMProvider() {
  if (config.llm.provider === 'google') {
    return new GoogleLLMProvider();
  }
  if (config.llm.provider === 'cloudflare') {
    return new CloudflareLLMProvider();
  }
  return new OpenAILLMProvider();
}
