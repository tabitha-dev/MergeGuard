import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from 'playwright';
import type { AxeViolation } from './types.js';

export async function runA11yScan(page: Page): Promise<AxeViolation[]> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    nodes: violation.nodes.length
  }));
}
