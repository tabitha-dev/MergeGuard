import * as core from '@actions/core';
import path from 'node:path';
import { getChangedFiles, getCurrentPrContext, getOctokit } from './github/pr-context.js';
import { postOrUpdatePrComment } from './github/pr-comment.js';
import { createDeterministicPlan } from './risk-engine/deterministic-mapper.js';
import { runBrowserChecks } from './browser-runner/run-check.js';
import { summarizeDeterministically } from './reporting/deterministic-summary.js';
import { createAgenticPlan, type LlmProvider } from './agent/planner.js';
import { summarizeWithAgent } from './agent/summarizer.js';
import { renderPrComment } from './reporting/markdown.js';
import { shouldFail } from './util/severity.js';
import { ensureDir, writeJson } from './util/fs.js';
import type { RunSummary } from './schemas/run-summary.js';
import type { Severity } from './schemas/finding.js';

function readMode(): 'deterministic' | 'agentic' {
  const value = core.getInput('mode') || 'deterministic';
  if (value !== 'deterministic' && value !== 'agentic') {
    throw new Error('mode must be deterministic or agentic');
  }
  return value;
}

function readLlmProvider(): LlmProvider {
  const value = core.getInput('llm-provider') || 'openai';
  if (value !== 'openai' && value !== 'rapidapi') {
    throw new Error('llm-provider must be openai or rapidapi');
  }
  return value;
}

function readFailOnSeverity(): 'none' | Severity {
  const value = core.getInput('fail-on-severity') || 'high';
  if (!['none', 'high', 'medium', 'low'].includes(value)) {
    throw new Error('fail-on-severity must be none, high, medium, or low');
  }
  return value as 'none' | Severity;
}

async function main(): Promise<void> {
  const started = Date.now();
  const githubToken = core.getInput('github-token', { required: true });
  const previewUrl = core.getInput('preview-url', { required: true });
  const openaiApiKey = core.getInput('openai-api-key');
  const rapidApiKey = core.getInput('rapidapi-key');
  const rapidApiHost = core.getInput('rapidapi-host') || 'open-ai21.p.rapidapi.com';
  const rapidApiEndpoint = core.getInput('rapidapi-endpoint') || 'claude3';
  const llmProvider = readLlmProvider();
  const artifactDir = core.getInput('artifact-dir') || './artifacts';
  const model = core.getInput('model') || 'gpt-4o-mini';
  const mode = readMode();
  const failOnSeverity = readFailOnSeverity();
  const commentMarker = core.getInput('comment-marker') || '<!-- mergeguard-ui-review -->';

  await ensureDir(artifactDir);

  const client = getOctokit(githubToken);
  const prContext = getCurrentPrContext(previewUrl);
  const changedFiles = await getChangedFiles(client, prContext);

  const fallbackPlan = createDeterministicPlan(changedFiles);
  let testPlan = fallbackPlan;
  let modelUsed = 'none';

  const agentApiKey = llmProvider === 'rapidapi' ? rapidApiKey : openaiApiKey;

  if (mode === 'agentic') {
    if (!agentApiKey) {
      core.warning(`mode=agentic was requested, but the ${llmProvider} API key was not provided. Falling back to deterministic planning and summarization.`);
    } else {
      try {
        testPlan = await createAgenticPlan({
          provider: llmProvider,
          apiKey: agentApiKey,
          model,
          changedFiles,
          prContext,
          fallbackPlan,
          rapidApiHost,
          rapidApiEndpoint
        });
        modelUsed = llmProvider === 'rapidapi' ? `rapidapi:${rapidApiEndpoint}` : model;
      } catch (error) {
        core.warning(`Agentic planning failed. Falling back to deterministic plan. ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  core.info(`Running ${testPlan.length} browser check(s).`);

  const browserResults = await runBrowserChecks({
    previewUrl,
    artifactDir,
    testPlan
  });

  const fallbackFindings = summarizeDeterministically(browserResults);
  let findings = fallbackFindings;

  if (mode === 'agentic' && agentApiKey) {
    try {
      findings = await summarizeWithAgent({
        provider: llmProvider,
        apiKey: agentApiKey,
        model,
        results: browserResults,
        fallbackFindings,
        rapidApiHost,
        rapidApiEndpoint
      });
      modelUsed = llmProvider === 'rapidapi' ? `rapidapi:${rapidApiEndpoint}` : model;
    } catch (error) {
      core.warning(`Agentic summarization failed. Falling back to deterministic findings. ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const summary: RunSummary = {
    context: prContext,
    mode,
    modelUsed,
    durationMs: Date.now() - started,
    changedFiles,
    testPlan,
    findings,
    generatedAt: new Date().toISOString()
  };

  await writeJson(path.join(artifactDir, 'run_summary.json'), summary);

  const markdown = renderPrComment(summary, commentMarker);
  await postOrUpdatePrComment(client, prContext, markdown, commentMarker);

  core.setOutput('findings-count', findings.length.toString());
  core.setOutput('run-summary', path.join(artifactDir, 'run_summary.json'));

  if (shouldFail(findings, failOnSeverity)) {
    core.setFailed(`MergeGuard found ${findings.length} finding(s) meeting fail-on-severity=${failOnSeverity}.`);
  }
}

main().catch((error) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
