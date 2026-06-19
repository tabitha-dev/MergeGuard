import { z } from 'zod';

export const FindingCategorySchema = z.enum([
  'accessibility',
  'layout',
  'console_error',
  'interaction'
]);

export type FindingCategory = z.infer<typeof FindingCategorySchema>;

export const SeveritySchema = z.enum(['high', 'medium', 'low']);
export type Severity = z.infer<typeof SeveritySchema>;

export const EvidenceSchema = z.object({
  type: z.enum(['screenshot', 'trace', 'log', 'json']),
  localPath: z.string().min(1),
  note: z.string().optional()
});

export type Evidence = z.infer<typeof EvidenceSchema>;

export const FindingSchema = z.object({
  category: FindingCategorySchema,
  severity: SeveritySchema,
  confidence: z.number().min(0).max(100),
  title: z.string().min(1),
  summary: z.string().min(1),
  suggestedCause: z.string().min(1),
  evidence: z.array(EvidenceSchema).min(1)
});

export type Finding = z.infer<typeof FindingSchema>;

export const FindingsSchema = z.object({
  findings: z.array(FindingSchema).max(50)
});
