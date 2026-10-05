import { z } from 'zod';
import { AnalysisError, type AnalysisErrorCode } from './analysisError';
import type { Env } from './env';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
/** Zgodnie z briefem: przy błędnej odpowiedzi AI jedna ponowna próba. */
const MAX_RETRIES = 1;
/** Kolejny model ma sens tylko przy limicie lub przeciążeniu; inne błędy dotyczą wszystkich modeli. */
const FALLBACK_ERRORS = new Set<AnalysisErrorCode>(['AI_QUOTA_EXCEEDED', 'AI_OVERLOADED']);

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
  /** Wspólny termin całej analizy; po jego upływie wywołania są przerywane. */
  signal: AbortSignal;
}

/**
 * Wywołuje model i zwraca odpowiedź zwalidowaną schematem.
 * Schemat jest też przekazywany modelowi jako JSON Schema, więc jest jedynym źródłem prawdy o formacie.
 */
export async function generateStructured<T>(
  env: Env,
  request: StructuredRequest,
  schema: z.ZodType<T>,
): Promise<T> {
  const schemaPrompt = `${request.prompt}\n\nReturn only JSON matching this JSON Schema:\n${JSON.stringify(z.toJSONSchema(schema))}`;
  let correction = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const responseText = await callGemini(env, { ...request, prompt: schemaPrompt + correction });
    const result = schema.safeParse(parseJson(responseText));
    if (result.success) return result.data;
    correction = `\n\nYour previous response did not match the schema:\n${z.prettifyError(result.error)}\nFix it and return the complete JSON.`;
  }

  throw new AnalysisError('INVALID_AI_RESPONSE');
}

/** Próbuje kolejnych modeli z GEMINI_MODELS, gdy poprzedni jest przeciążony (503) lub wyczerpał limit (429). */
async function callGemini(env: Env, request: StructuredRequest): Promise<string> {
  const models = env.GEMINI_MODELS.split(',').map((model) => model.trim());
  let lastError = new AnalysisError('AI_UNAVAILABLE');

  for (const model of models) {
    try {
      return await callModel(env, model, request);
    } catch (error) {
      if (!(error instanceof AnalysisError) || !FALLBACK_ERRORS.has(error.code)) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

async function callModel(
  env: Env,
  model: string,
  { systemInstruction, prompt, signal }: StructuredRequest,
): Promise<string> {
  let response: Response;
  let responseText: string;
  try {
    response = await fetch(`${GEMINI_API_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
      signal,
    });
    responseText = await response.text();
  } catch {
    throw new AnalysisError(signal.aborted ? 'AI_TIMEOUT' : 'AI_UNAVAILABLE');
  }

  if (response.status === 429) throw new AnalysisError('AI_QUOTA_EXCEEDED');
  if (response.status === 503) throw new AnalysisError('AI_OVERLOADED');
  if (!response.ok) throw new AnalysisError('AI_UNAVAILABLE');

  const body = geminiResponseSchema.safeParse(parseJson(responseText));
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
