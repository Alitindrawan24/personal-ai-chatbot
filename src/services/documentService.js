import { VectorizeClient } from '../infrastructure/vector/vectorize.js';
import { getEmbeddingProvider } from '../infrastructure/embedding/embeddingProvider.js';
import { semanticChunk } from '../utils/chunker.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

export class DocumentService {
  constructor() {
    this.vectorize = new VectorizeClient();
    this.embeddingProvider = getEmbeddingProvider();
  }

  /**
   * Ingest document into vector store
   * @param {string} content - Document content
   * @param {object} metadata - Document metadata
   * @returns {Promise<object>} Ingestion result
   */
  async ingestDocument(content, metadata = {}) {
    try {
      logger.info('Starting document ingestion', { contentLength: content.length });

      const chunks = semanticChunk(content, config.embedding.chunkSize);
      logger.info('Content chunked', { chunkCount: chunks.length });

      const embeddings = await this.embeddingProvider.generateEmbeddings(chunks);
      logger.info('Embeddings generated', { count: embeddings.length });

      const vectors = chunks.map((chunk, index) => ({
        id: crypto.randomUUID(),
        values: embeddings[index],
        metadata: {
          text: chunk,
          source: metadata.source || 'unknown',
          tags: metadata.tags || [],
          type: metadata.type || 'text',
          chunkIndex: index,
          timestamp: new Date().toISOString()
        }
      }));

      await this.vectorize.insert(vectors);
      logger.info('Vectors inserted into Vectorize', { count: vectors.length });

      return {
        success: true,
        chunksProcessed: chunks.length,
        vectorIds: vectors.map(v => v.id)
      };
    } catch (error) {
      logger.error('Document ingestion failed', error);
      throw error;
    }
  }
}
