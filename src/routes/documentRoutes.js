import express from 'express';
import { ingestDocument, getAllDocuments } from '../controllers/documentController.js';

const router = express.Router();

router.post('/ingest', ingestDocument);
router.get('/', getAllDocuments);

export default router;
