import { DocumentService } from '../services/documentService.js';
import { ingestDocumentSchema } from '../utils/validators.js';

const documentService = new DocumentService();

/**
 * Ingest document endpoint
 */
export async function ingestDocument(req, res, next) {
  try {
    const validated = ingestDocumentSchema.parse(req.body);
    
    const result = await documentService.ingestDocument(
      validated.content,
      validated.metadata
    );
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get all documents endpoint
 */
export async function getAllDocuments(req, res, next) {
  try {
    const documents = await documentService.getAllDocuments();
    res.json({ success: true, count: documents.length, documents });
  } catch (error) {
    next(error);
  }
}
