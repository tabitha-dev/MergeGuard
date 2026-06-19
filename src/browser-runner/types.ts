import type { TestPlanItem } from '../schemas/test-plan.js';
import type { Evidence } from '../schemas/finding.js';

export type ConsoleRecord = {
  type: string;
  text: string;
  location?: string;
};

export type NetworkFailure = {
  url: string;
  method: string;
  failureText?: string;
  status?: number;
};

export type AxeViolation = {
  id: string;
  impact?: string | null;
  description?: string;
  help?: string;
  nodes: number;
};

export type LayoutObservation = {
  hasHorizontalOverflow: boolean;
  documentWidth: number;
  viewportWidth: number;
  offenders: { selector: string; width: number; left: number; right: number; text?: string }[];
};

export type InteractionObservation = {
  attempted: string[];
  failures: string[];
  focusBefore?: string;
  focusAfter?: string;
};

export type BrowserCheckResult = {
  item: TestPlanItem;
  url: string;
  status: 'passed' | 'failed' | 'warning';
  durationMs: number;
  consoleMessages: ConsoleRecord[];
  pageErrors: string[];
  networkFailures: NetworkFailure[];
  axeViolations: AxeViolation[];
  layout?: LayoutObservation;
  interaction?: InteractionObservation;
  evidence: Evidence[];
  notes: string[];
};

export type BrowserRunOptions = {
  previewUrl: string;
  artifactDir: string;
  testPlan: TestPlanItem[];
};
