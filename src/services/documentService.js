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

      const version = Date.now();
      const vectors = chunks.map((chunk, index) => ({
        id: `doc-chunk-${index}`,
        values: embeddings[index],
        metadata: {
          text: chunk,
          source: metadata.source || 'unknown',
          tags: metadata.tags || [],
          type: metadata.type || 'text',
          chunkIndex: index,
          version,
          timestamp: new Date().toISOString()
        }
      }));

      await this.vectorize.upsert(vectors);
      logger.info('Vectors upserted into Vectorize', { count: vectors.length, version });

      return {
        success: true,
        chunksProcessed: chunks.length,
        vectorIds: vectors.map(v => v.id),
        version
      };
    } catch (error) {
      logger.error('Document ingestion failed', error);
      throw error;
    }
  }

  /**
   * Get all documents from vector store
   * @returns {Promise<Array>} All documents
   */
  async getAllDocuments() {
    try {
      const vectors = await this.vectorize.listAll();
      return vectors.map(v => ({
        id: v.id,
        score: v.score,
        metadata: v.metadata
      }));
    } catch (error) {
      logger.error('Failed to retrieve documents', error);
      throw error;
    }
  }
}
