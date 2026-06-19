export type RapidApiOptions = {
  apiKey: string;
  host?: string;
  endpoint?: string;
  webAccess?: boolean;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  const directKeys = ['result', 'response', 'content', 'text', 'output', 'answer', 'message'];
  for (const key of directKeys) {
    const candidate = record[key];
    if (typeof candidate === 'string') return candidate;
  }

  const choices = record.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first = choices[0] as Record<string, unknown>;
    const message = first.message as Record<string, unknown> | undefined;
    if (message && typeof message.content === 'string') return message.content;
    if (typeof first.text === 'string') return first.text;
  }

  const data = record.data;
  if (Array.isArray(data) && data.length > 0) {
    const nested = pickString(data[0]);
    if (nested) return nested;
  }

  return undefined;
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue below. Some hosted model endpoints wrap the model text in a response object
    // or add prose around the JSON. We still parse conservatively and validate with Zod later.
  }

  const maybeEnvelope = (() => {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return undefined;
    }
  })();

  const nested = pickString(maybeEnvelope);
  if (nested) {
    try {
      return JSON.parse(nested.trim());
    } catch {
      // Continue to substring extraction.
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error('RapidAPI response did not contain parseable JSON.');
}

export async function callRapidApiChat(options: RapidApiOptions, messages: ChatMessage[]): Promise<string> {
  const host = options.host || 'open-ai21.p.rapidapi.com';
  const endpoint = (options.endpoint || 'claude3').replace(/^\/+/, '');
  const url = `https://${host}/${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-rapidapi-key': options.apiKey,
      'x-rapidapi-host': host,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      web_access: options.webAccess ?? false
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`RapidAPI request failed with ${response.status}: ${text.slice(0, 500)}`);
  }

  const envelope = (() => {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return undefined;
    }
  })();

  return pickString(envelope) || text;
}
