import type { Finding, Severity } from '../schemas/finding.js';

const rank: Record<Severity, number> = {
  high: 3,
  medium: 2,
  low: 1
};

export function shouldFail(findings: Finding[], threshold: 'none' | Severity): boolean {
  if (threshold === 'none') return false;
  return findings.some((finding) => rank[finding.severity] >= rank[threshold]);
}

export function severityIcon(severity: Severity): string {
  switch (severity) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟠';
    case 'low':
      return '🟡';
  }
}
