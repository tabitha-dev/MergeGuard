import type { GitHubClient } from './pr-context.js';
import type { PRContext } from '../schemas/run-summary.js';

export async function postOrUpdatePrComment(
  client: GitHubClient,
  context: PRContext,
  body: string,
  marker: string
): Promise<void> {
  const comments = await client.paginate(client.rest.issues.listComments, {
    owner: context.owner,
    repo: context.repo,
    issue_number: context.prNumber,
    per_page: 100
  });

  const existing = comments.find((comment) => comment.body?.includes(marker));

  if (existing) {
    await client.rest.issues.updateComment({
      owner: context.owner,
      repo: context.repo,
      comment_id: existing.id,
      body
    });
    return;
  }

  await client.rest.issues.createComment({
    owner: context.owner,
    repo: context.repo,
    issue_number: context.prNumber,
    body
  });
}
