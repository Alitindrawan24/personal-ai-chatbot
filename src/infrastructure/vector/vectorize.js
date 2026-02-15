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
    const response = await fetch(`${this.baseUrl}/delete`, {
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
}
