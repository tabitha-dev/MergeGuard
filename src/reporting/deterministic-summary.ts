import type { BrowserCheckResult } from '../browser-runner/types.js';
import type { Finding } from '../schemas/finding.js';

function evidenceFor(result: BrowserCheckResult) {
  return result.evidence.length > 0 ? result.evidence : [{ type: 'log' as const, localPath: './artifacts/run_summary.json' }];
}

export function summarizeDeterministically(results: BrowserCheckResult[]): Finding[] {
  const findings: Finding[] = [];

  for (const result of results) {
    if (result.pageErrors.length > 0) {
      findings.push({
        category: 'console_error',
        severity: 'high',
        confidence: 96,
        title: `Runtime page error on ${result.item.targetSurface}`,
        summary: `The browser reported ${result.pageErrors.length} page error(s) while testing ${result.url}. First error: ${result.pageErrors[0]}`,
        suggestedCause: 'A changed component or effect may be throwing during render, hydration, or user interaction. Check the Playwright trace and console log for stack details.',
        evidence: evidenceFor(result)
      });
    }

    const consoleErrors = result.consoleMessages.filter((record) => record.type === 'error');
    if (consoleErrors.length > 0) {
      findings.push({
        category: 'console_error',
        severity: 'medium',
        confidence: 90,
        title: `Console errors on ${result.item.targetSurface}`,
        summary: `The browser console logged ${consoleErrors.length} error(s). First error: ${consoleErrors[0].text}`,
        suggestedCause: 'A runtime dependency, event handler, or data assumption may be failing in the preview environment.',
        evidence: evidenceFor(result)
      });
    }

    if (result.networkFailures.length > 0) {
      findings.push({
        category: 'console_error',
        severity: 'medium',
        confidence: 86,
        title: `Network failures while testing ${result.item.targetSurface}`,
        summary: `Detected ${result.networkFailures.length} failed or 5xx network request(s). First affected URL: ${result.networkFailures[0].url}`,
        suggestedCause: 'The preview environment may be missing configuration, or the PR may have changed API routes or client fetch logic.',
        evidence: evidenceFor(result)
      });
    }

    const severeA11y = result.axeViolations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''));
    if (severeA11y.length > 0) {
      findings.push({
        category: 'accessibility',
        severity: severeA11y.some((violation) => violation.impact === 'critical') ? 'high' : 'medium',
        confidence: 92,
        title: `Accessibility issue on ${result.item.targetSurface}`,
        summary: `Axe reported ${severeA11y.length} serious or critical violation(s). First issue: ${severeA11y[0].id} affecting ${severeA11y[0].nodes} node(s).`,
        suggestedCause: 'Likely missing accessible labels, insufficient contrast, invalid ARIA, or keyboard navigation markup in the changed UI surface.',
        evidence: evidenceFor(result)
      });
    }

    if (result.layout?.hasHorizontalOverflow) {
      const offender = result.layout.offenders[0];
      findings.push({
        category: 'layout',
        severity: result.item.viewport === 'mobile' ? 'medium' : 'low',
        confidence: offender ? 91 : 80,
        title: `Possible horizontal overflow on ${result.item.viewport}`,
        summary: offender
          ? `Document width exceeded viewport width. First offender: ${offender.selector} with right edge at ${offender.right}px in a ${result.layout.viewportWidth}px viewport.`
          : `Document width was ${result.layout.documentWidth}px in a ${result.layout.viewportWidth}px viewport.`,
        suggestedCause: 'A fixed width, long unwrapped content, absolute positioning, or grid/flex rule may be causing clipping or horizontal scrolling.',
        evidence: evidenceFor(result)
      });
    }

    if ((result.interaction?.failures.length ?? 0) > 0) {
      findings.push({
        category: 'interaction',
        severity: 'high',
        confidence: 88,
        title: `Interaction probe failed on ${result.item.targetSurface}`,
        summary: result.interaction?.failures.join(' ') ?? 'The interaction probe failed.',
        suggestedCause: 'The changed surface may be missing stable selectors, accessible controls, focus restoration, or keyboard support.',
        evidence: evidenceFor(result)
      });
    }
  }

  return dedupeFindings(findings).slice(0, 20);
}

function dedupeFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const result: Finding[] = [];
  for (const finding of findings) {
    const key = `${finding.category}:${finding.severity}:${finding.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(finding);
  }
  return result;
}
