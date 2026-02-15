import { z } from 'zod';

export const ingestDocumentSchema = z.object({
  content: z.string().min(1),
  metadata: z.object({
    source: z.string().optional(),
    tags: z.array(z.string()).optional(),
    type: z.string().optional()
  }).optional()
});

export const chatQuerySchema = z.object({
  question: z.string().min(1),
  conversationId: z.string().optional(),
  language: z.enum(['en', 'id']).optional().default('en'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
});
