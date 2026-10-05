import { z } from 'zod';
import { AnalysisError } from './analysisError';
import type { Env } from './env';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 25_000;
/** Zgodnie z briefem: przy błędnej odpowiedzi AI jedna ponowna próba. */
const MAX_RETRIES = 1;

const geminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }).optional(),
      }),
    )
    .optional(),
});

interface StructuredRequest {
  systemInstruction: string;
  prompt: string;
}

/**
 * Wywołuje model i zwraca odpowiedź zwalidowaną schematem.
 * Schemat jest też przekazywany modelowi jako JSON Schema, więc jest jedynym źródłem prawdy o formacie.
 */
export async function generateStructured<T>(
  env: Env,
  { systemInstruction, prompt }: StructuredRequest,
  schema: z.ZodType<T>,
): Promise<T> {
  const schemaPrompt = `${prompt}\n\nReturn only JSON matching this JSON Schema:\n${JSON.stringify(z.toJSONSchema(schema))}`;
  let correction = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const responseText = await callGemini(env, systemInstruction, schemaPrompt + correction);
    const result = schema.safeParse(parseJson(responseText));
    if (result.success) return result.data;
    correction = `\n\nYour previous response did not match the schema:\n${z.prettifyError(result.error)}\nFix it and return the complete JSON.`;
  }

  throw new AnalysisError('INVALID_AI_RESPONSE');
}

/** Próbuje kolejnych modeli z GEMINI_MODELS, gdy poprzedni jest przeciążony lub wyczerpał limit. */
async function callGemini(env: Env, systemInstruction: string, prompt: string): Promise<string> {
  const models = env.GEMINI_MODELS.split(',').map((model) => model.trim());
  let lastError = new AnalysisError('AI_UNAVAILABLE');

  for (const model of models) {
    try {
      return await callModel(env, model, systemInstruction, prompt);
    } catch (error) {
      if (!(error instanceof AnalysisError)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

async function callModel(
  env: Env,
  model: string,
  systemInstruction: string,
  prompt: string,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new AnalysisError('AI_UNAVAILABLE');
  }

  if (response.status === 429) throw new AnalysisError('AI_QUOTA_EXCEEDED');
  if (!response.ok) throw new AnalysisError('AI_UNAVAILABLE');

  const body = geminiResponseSchema.safeParse(await response.json());
  const parts = body.success ? (body.data.candidates?.[0]?.content?.parts ?? []) : [];
  return parts.map((part) => part.text ?? '').join('');
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
