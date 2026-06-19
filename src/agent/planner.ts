import OpenAI from 'openai';
import { TestPlanSchema, type TestPlanItem } from '../schemas/test-plan.js';
import type { PRContext } from '../schemas/run-summary.js';
import { callRapidApiChat, extractJsonObject, type ChatMessage } from './rapidapi.js';

export type LlmProvider = 'openai' | 'rapidapi';

export type PlannerOptions = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  changedFiles: string[];
  prContext: PRContext;
  fallbackPlan: TestPlanItem[];
  rapidApiHost?: string;
  rapidApiEndpoint?: string;
};

const plannerSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['test_plan'],
  properties: {
    test_plan: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['targetSurface', 'route', 'viewport', 'checkType', 'reason', 'changedFiles', 'selectors'],
        properties: {
          targetSurface: { type: 'string' },
          route: { type: 'string', description: 'Optional relative route such as /checkout. Use empty string when unknown.' },
          viewport: { type: 'string', enum: ['mobile', 'tablet', 'desktop'] },
          checkType: { type: 'string', enum: ['accessibility', 'interaction', 'visual', 'layout', 'console'] },
          reason: { type: 'string' },
          changedFiles: { type: 'array', items: { type: 'string' } },
          selectors: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
} as const;

function plannerMessages(options: PlannerOptions): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You are a senior frontend QA architect.',
        'Review the changed files in this pull request and identify only UI surfaces that need browser testing.',
        'Do not suggest testing unrelated areas.',
        'Prefer fewer high-signal checks over broad coverage.',
        'Map changes to specific viewports and check types.',
        'Every test plan item must include a reason tied to one or more changed files.',
        'Never include destructive flows such as payments, deletion, billing changes, or real submissions.',
        'Return only valid JSON. Do not wrap the JSON in markdown.',
        `The JSON must match this schema: ${JSON.stringify(plannerSchema)}`
      ].join('\n')
    },
    {
      role: 'user',
      content: JSON.stringify(
        {
          repo: options.prContext.repoFullName,
          prNumber: options.prContext.prNumber,
          previewUrl: options.prContext.previewUrl,
          changed_files: options.changedFiles,
          fallback_plan: options.fallbackPlan
        },
        null,
        2
      )
    }
  ];
}

async function createOpenAiPlan(options: PlannerOptions): Promise<TestPlanItem[]> {
  const client = new OpenAI({ apiKey: options.apiKey });

  const completion = await client.chat.completions.create({
    model: options.model,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'mergeguard_test_plan',
        strict: true,
        schema: plannerSchema
      }
    },
    messages: plannerMessages(options)
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return options.fallbackPlan;

  const parsed = TestPlanSchema.parse(JSON.parse(content));
  return parsed.test_plan;
}

async function createRapidApiPlan(options: PlannerOptions): Promise<TestPlanItem[]> {
  const content = await callRapidApiChat(
    {
      apiKey: options.apiKey,
      host: options.rapidApiHost,
      endpoint: options.rapidApiEndpoint
    },
    plannerMessages(options)
  );

  const parsed = TestPlanSchema.parse(extractJsonObject(content));
  return parsed.test_plan;
}

export async function createAgenticPlan(options: PlannerOptions): Promise<TestPlanItem[]> {
  if (options.provider === 'rapidapi') {
    return createRapidApiPlan(options);
  }

  return createOpenAiPlan(options);
}
