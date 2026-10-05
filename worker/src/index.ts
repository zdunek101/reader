import { MAX_TEXT_CHARS } from '../../src/lib/limits';
import { analyzeRequestSchema } from '../../src/lib/schema';
import { AnalysisError } from './analysisError';
import { analyzeDocument } from './analyzeDocument';
import type { Env } from './env';

/** Znak UTF-8 zajmuje maks. 4 bajty; zapas na pozostałe pola JSON. */
const MAX_BODY_BYTES = MAX_TEXT_CHARS * 4 + 4096;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((value) => value.trim());
    const corsHeaders = allowedOrigins.includes(origin) ? buildCorsHeaders(origin) : {};

    try {
      if (!allowedOrigins.includes(origin)) throw new AnalysisError('FORBIDDEN_ORIGIN');
      if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

      const { pathname } = new URL(request.url);
      if (request.method !== 'POST' || pathname !== '/analyze')
        throw new AnalysisError('NOT_FOUND');

      const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const [clientLimit, globalLimit] = await Promise.all([
        env.CLIENT_RATE_LIMITER.limit({ key: clientIp }),
        env.GLOBAL_RATE_LIMITER.limit({ key: 'global' }),
      ]);
      if (!clientLimit.success || !globalLimit.success) throw new AnalysisError('RATE_LIMITED');

      const insight = await analyzeDocument(env, await readAnalyzeRequest(request));
      return Response.json(insight, { headers: corsHeaders });
    } catch (error) {
      const analysisError = error instanceof AnalysisError ? error : new AnalysisError('INTERNAL');
      return Response.json(
        { error: { code: analysisError.code, message: analysisError.message } },
        { status: analysisError.status, headers: corsHeaders },
      );
    }
  },
} satisfies ExportedHandler<Env>;

async function readAnalyzeRequest(request: Request) {
  const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) throw new AnalysisError('PAYLOAD_TOO_LARGE');

  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) throw new AnalysisError('PAYLOAD_TOO_LARGE');

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new AnalysisError('BAD_REQUEST');
  }

  const parsed = analyzeRequestSchema.safeParse(json);
  if (!parsed.success) throw new AnalysisError('BAD_REQUEST');
  return parsed.data;
}

function buildCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
