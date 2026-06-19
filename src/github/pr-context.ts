import * as core from '@actions/core';
import * as github from '@actions/github';
import type { PRContext } from '../schemas/run-summary.js';

export type GitHubClient = ReturnType<typeof github.getOctokit>;

export function getOctokit(token: string): GitHubClient {
  return github.getOctokit(token);
}

export function getCurrentPrContext(previewUrl: string): PRContext {
  const payload = github.context.payload;
  const pullRequest = payload.pull_request;
  if (!pullRequest) {
    throw new Error('MergeGuard UI must run in a pull_request workflow context.');
  }

  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;

  return {
    owner,
    repo,
    repoFullName: `${owner}/${repo}`,
    prNumber: pullRequest.number,
    commitSha: pullRequest.head?.sha ?? github.context.sha,
    previewUrl,
    runId: Number(process.env.GITHUB_RUN_ID || '0') || undefined,
    runAttempt: Number(process.env.GITHUB_RUN_ATTEMPT || '0') || undefined,
    serverUrl: process.env.GITHUB_SERVER_URL ?? 'https://github.com'
  };
}

export async function getChangedFiles(client: GitHubClient, context: PRContext): Promise<string[]> {
  const files = await client.paginate(client.rest.pulls.listFiles, {
    owner: context.owner,
    repo: context.repo,
    pull_number: context.prNumber,
    per_page: 100
  });

  const names = files.map((file) => file.filename);
  core.info(`Found ${names.length} changed file(s).`);
  return names;
}
