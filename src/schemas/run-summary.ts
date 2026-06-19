import { z } from 'zod';
import { FindingSchema } from './finding.js';

export const PRContextSchema = z.object({
  owner: z.string(),
  repo: z.string(),
  repoFullName: z.string(),
  prNumber: z.number(),
  commitSha: z.string(),
  previewUrl: z.string(),
  runId: z.number().optional(),
  runAttempt: z.number().optional(),
  serverUrl: z.string().optional()
});

export type PRContext = z.infer<typeof PRContextSchema>;

export const RunSummarySchema = z.object({
  context: PRContextSchema,
  mode: z.enum(['deterministic', 'agentic']),
  modelUsed: z.string(),
  durationMs: z.number(),
  changedFiles: z.array(z.string()),
  testPlan: z.array(z.any()),
  findings: z.array(FindingSchema),
  generatedAt: z.string()
});

export type RunSummary = z.infer<typeof RunSummarySchema>;
