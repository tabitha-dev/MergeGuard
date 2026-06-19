import type { TestPlanItem } from '../schemas/test-plan.js';
import { riskRules } from './risk-rules.js';

const DEFAULT_PLAN: TestPlanItem[] = [
  {
    targetSurface: 'Changed frontend surface',
    viewport: 'mobile',
    checkType: 'layout',
    reason: 'Fallback mobile layout check because no specific risk rule matched.',
    changedFiles: [],
    selectors: []
  },
  {
    targetSurface: 'Changed frontend surface',
    viewport: 'desktop',
    checkType: 'console',
    reason: 'Fallback runtime console check because no specific risk rule matched.',
    changedFiles: [],
    selectors: []
  },
  {
    targetSurface: 'Changed frontend surface',
    viewport: 'desktop',
    checkType: 'accessibility',
    reason: 'Fallback accessibility smoke check because no specific risk rule matched.',
    changedFiles: [],
    selectors: []
  }
];

function looksFrontendFile(file: string): boolean {
  return /\.(tsx|jsx|ts|js|vue|svelte|css|scss|sass|html|mdx)$/.test(file);
}

export function createDeterministicPlan(changedFiles: string[]): TestPlanItem[] {
  const frontendFiles = changedFiles.filter(looksFrontendFile);
  const plan: TestPlanItem[] = [];

  for (const rule of riskRules) {
    const matchedFiles = frontendFiles.filter((file) => rule.patterns.some((pattern) => pattern.test(file)));
    if (matchedFiles.length === 0) continue;

    for (const viewport of rule.viewports) {
      for (const checkType of rule.checks) {
        plan.push({
          targetSurface: rule.surface,
          viewport,
          checkType,
          reason: rule.reason,
          changedFiles: matchedFiles,
          selectors: rule.selectors ?? []
        });
      }
    }
  }

  const deduped = dedupePlan(plan);
  if (deduped.length > 0) return deduped.slice(0, 16);

  return DEFAULT_PLAN.map((item) => ({ ...item, changedFiles: frontendFiles }));
}

function dedupePlan(plan: TestPlanItem[]): TestPlanItem[] {
  const seen = new Set<string>();
  const result: TestPlanItem[] = [];

  for (const item of plan) {
    const key = `${item.targetSurface}:${item.viewport}:${item.checkType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}
