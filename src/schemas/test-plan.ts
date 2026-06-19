import { z } from 'zod';

export const ViewportNameSchema = z.enum(['mobile', 'tablet', 'desktop']);
export type ViewportName = z.infer<typeof ViewportNameSchema>;

export const CheckTypeSchema = z.enum([
  'accessibility',
  'interaction',
  'visual',
  'layout',
  'console'
]);
export type CheckType = z.infer<typeof CheckTypeSchema>;

export const TestPlanItemSchema = z.object({
  targetSurface: z.string().min(1),
  route: z.string().optional().describe('Optional relative route such as /checkout or absolute URL.'),
  viewport: ViewportNameSchema,
  checkType: CheckTypeSchema,
  reason: z.string().min(1),
  changedFiles: z.array(z.string()).default([]),
  selectors: z.array(z.string()).default([])
});

export type TestPlanItem = z.infer<typeof TestPlanItemSchema>;

export const TestPlanSchema = z.object({
  test_plan: z.array(TestPlanItemSchema).min(1).max(20)
});

export type TestPlan = z.infer<typeof TestPlanSchema>;

export function viewportSize(viewport: ViewportName): { width: number; height: number } {
  switch (viewport) {
    case 'mobile':
      return { width: 390, height: 844 };
    case 'tablet':
      return { width: 768, height: 1024 };
    case 'desktop':
      return { width: 1440, height: 900 };
  }
}
