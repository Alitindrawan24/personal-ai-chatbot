import { config } from '../../config/env.js';

/**
 * Cloudflare Vectorize client
 */
export class VectorizeClient {
  constructor() {
    this.accountId = config.cloudflare.accountId;
    this.apiToken = config.cloudflare.apiToken;
    this.indexName = config.cloudflare.vectorizeIndexName;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/vectorize/v2/indexes/${this.indexName}`;
  }

  /**
   * Insert vectors into Vectorize
   * @param {Array} vectors - Array of {id, values, metadata}
   */
  async insert(vectors) {
    const response = await fetch(`${this.baseUrl}/insert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vectors })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vectorize insert failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Upsert vectors into Vectorize (insert or update)
   * @param {Array} vectors - Array of {id, values, metadata}
   */
  async upsert(vectors) {
    const response = await fetch(`${this.baseUrl}/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ vectors })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vectorize upsert failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Query vectors by similarity
   * @param {number[]} vector - Query vector
   * @param {number} topK - Number of results
   * @returns {Promise<Array>} Similar vectors with scores
   */
  async query(vector, topK = 5) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vector,
        topK,
        returnMetadata: 'all'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vectorize query failed: ${error}`);
    }

    const data = await response.json();
    return data.result.matches || [];
  }

  /**
   * Delete vectors by IDs
   * @param {string[]} ids - Vector IDs to delete
   */
  async delete(ids) {
    const response = await fetch(`${this.baseUrl}/deleteByIds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vectorize delete failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get index info
   */
  async getInfo() {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vectorize getInfo failed: ${error}`);
    }

    return response.json();
  }

  /**
   * List all vectors (workaround using query)
   */
  async listAll(limit = 50) {
    const info = await this.getInfo();
    const dimensions = info.result?.config?.dimensions || 768;
    const zeroVector = new Array(dimensions).fill(0);
    
    return this.query(zeroVector, Math.min(limit, 50));
  }

  /**
   * Delete all vectors from index
   */
  async deleteAll() {
    const vectors = await this.listAll();
    if (vectors.length === 0) return { deleted: 0 };
    
    const ids = vectors.map(v => v.id);
    await this.delete(ids);
    return { deleted: ids.length };
  }
}
