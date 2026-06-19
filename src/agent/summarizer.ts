import OpenAI from 'openai';
import { FindingsSchema, type Finding } from '../schemas/finding.js';
import type { BrowserCheckResult } from '../browser-runner/types.js';
import { callRapidApiChat, extractJsonObject, type ChatMessage } from './rapidapi.js';
import type { LlmProvider } from './planner.js';

export type SummarizerOptions = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  results: BrowserCheckResult[];
  fallbackFindings: Finding[];
  rapidApiHost?: string;
  rapidApiEndpoint?: string;
};

const findingsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      maxItems: 20,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'severity', 'confidence', 'title', 'summary', 'suggestedCause', 'evidence'],
        properties: {
          category: { type: 'string', enum: ['accessibility', 'layout', 'console_error', 'interaction'] },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          title: { type: 'string' },
          summary: { type: 'string' },
          suggestedCause: { type: 'string' },
          evidence: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['type', 'localPath', 'note'],
              properties: {
                type: { type: 'string', enum: ['screenshot', 'trace', 'log', 'json'] },
                localPath: { type: 'string' },
                note: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
} as const;

function compactResults(results: BrowserCheckResult[]) {
  return results.map((result) => ({
    item: result.item,
    url: result.url,
    status: result.status,
    consoleMessages: result.consoleMessages.slice(0, 10),
    pageErrors: result.pageErrors.slice(0, 10),
    networkFailures: result.networkFailures.slice(0, 10),
    axeViolations: result.axeViolations.slice(0, 10),
    layout: result.layout,
    interaction: result.interaction,
    evidence: result.evidence,
    notes: result.notes
  }));
}

function summarizerMessages(options: SummarizerOptions): ChatMessage[] {
  return [
    {
      role: 'system',
      content: [
        'You are a precise frontend reviewer.',
        'Analyze raw browser automation results from Playwright.',
        'Only report issues if there is concrete evidence such as a failed selector, console error, page error, network failure, Axe violation, layout overflow, trace, or screenshot.',
        'Never invent bugs.',
        'Assign confidence based on clarity of evidence.',
        'Suggest likely technical root cause using careful language.',
        'Do not include a finding with no evidence item.',
        'If evidence is ambiguous, lower confidence or omit the finding.',
        'Return only valid JSON. Do not wrap the JSON in markdown.',
        `The JSON must match this schema: ${JSON.stringify(findingsSchema)}`
      ].join('\n')
    },
    {
      role: 'user',
      content: JSON.stringify({ browser_results: compactResults(options.results), fallback_findings: options.fallbackFindings }, null, 2)
    }
  ];
}

async function summarizeWithOpenAi(options: SummarizerOptions): Promise<Finding[]> {
  const client = new OpenAI({ apiKey: options.apiKey });

  const completion = await client.chat.completions.create({
    model: options.model,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'mergeguard_findings',
        strict: true,
        schema: findingsSchema
      }
    },
    messages: summarizerMessages(options)
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return options.fallbackFindings;

  const parsed = FindingsSchema.parse(JSON.parse(content));
  return parsed.findings.length > 0 ? parsed.findings : options.fallbackFindings;
}

async function summarizeWithRapidApi(options: SummarizerOptions): Promise<Finding[]> {
  const content = await callRapidApiChat(
    {
      apiKey: options.apiKey,
      host: options.rapidApiHost,
      endpoint: options.rapidApiEndpoint
    },
    summarizerMessages(options)
  );

  const parsed = FindingsSchema.parse(extractJsonObject(content));
  return parsed.findings.length > 0 ? parsed.findings : options.fallbackFindings;
}

export async function summarizeWithAgent(options: SummarizerOptions): Promise<Finding[]> {
  if (options.provider === 'rapidapi') {
    return summarizeWithRapidApi(options);
  }

  return summarizeWithOpenAi(options);
}
