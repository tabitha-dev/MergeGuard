import type { RunSummary } from '../schemas/run-summary.js';
import { severityIcon } from '../util/severity.js';

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function artifactRunUrl(summary: RunSummary): string | undefined {
  const { serverUrl, owner, repo, runId } = summary.context;
  if (!serverUrl || !runId) return undefined;
  return `${serverUrl}/${owner}/${repo}/actions/runs/${runId}`;
}

export function renderPrComment(summary: RunSummary, marker: string): string {
  const runUrl = artifactRunUrl(summary);
  const high = summary.findings.filter((finding) => finding.severity === 'high').length;
  const medium = summary.findings.filter((finding) => finding.severity === 'medium').length;
  const low = summary.findings.filter((finding) => finding.severity === 'low').length;

  const lines: string[] = [
    marker,
    '## MergeGuard UI Review',
    '',
    `Preview tested: ${summary.context.previewUrl}`,
    `Commit: \`${summary.context.commitSha.slice(0, 12)}\``,
    `Mode: \`${summary.mode}\``,
    `Model: \`${summary.modelUsed}\``,
    `Duration: ${(summary.durationMs / 1000).toFixed(1)}s`,
    runUrl ? `Evidence artifacts: [open workflow run](${runUrl})` : 'Evidence artifacts: uploaded by the workflow when configured',
    '',
    '### Summary',
    '',
    summary.findings.length === 0
      ? 'No evidence-backed issues were found in the targeted checks.'
      : `Found ${summary.findings.length} evidence-backed issue(s): ${high} high, ${medium} medium, ${low} low.`,
    '',
    '### Test plan',
    '',
    '| Surface | Viewport | Check | Reason |',
    '|---|---:|---|---|'
  ];

  for (const item of summary.testPlan) {
    lines.push(
      `| ${escapeTable(item.targetSurface)} | ${item.viewport} | ${item.checkType} | ${escapeTable(item.reason)} |`
    );
  }

  if (summary.findings.length > 0) {
    lines.push('', '### Findings', '', '| Severity | Category | Finding | Confidence |', '|---|---|---|---:|');
    for (const finding of summary.findings) {
      lines.push(
        `| ${severityIcon(finding.severity)} ${finding.severity} | ${finding.category} | ${escapeTable(finding.title)} | ${finding.confidence}% |`
      );
    }

    for (const finding of summary.findings) {
      lines.push(
        '',
        '<details>',
        `<summary>${severityIcon(finding.severity)} ${finding.severity.toUpperCase()}: ${finding.title}</summary>`,
        '',
        finding.summary,
        '',
        `Suggested cause: ${finding.suggestedCause}`,
        '',
        'Evidence:',
        ...finding.evidence.map((evidence) => `- ${evidence.type}: \`${evidence.localPath}\`${evidence.note ? `, ${evidence.note}` : ''}`),
        '',
        '</details>'
      );
    }
  }

  lines.push(
    '',
    '---',
    '',
    '_MergeGuard only reports issues with browser evidence. Automated accessibility checks are not a substitute for a complete manual audit._'
  );

  return `${lines.join('\n')}\n`;
}
