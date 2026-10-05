import { CHUNK_CHARS } from '../../src/lib/limits';
import {
  aiInsightSchema,
  insightSchema,
  type AiInsight,
  type AnalyzeRequest,
  type Insight,
} from '../../src/lib/schema';
import type { Env } from './env';
import { generateStructured } from './gemini';
import { mergeInsights } from './mergeInsights';
import { buildDocumentPrompt, buildOverviewPrompt, SYSTEM_INSTRUCTION } from './prompts';
import { splitIntoChunks } from './textChunks';

const overviewSchema = aiInsightSchema.pick({ summary: true, keyPoints: true });

/** Analizuje tekst dokumentu; długie dokumenty dzieli na fragmenty i łączy wyniki (map → reduce). */
export async function analyzeDocument(
  env: Env,
  request: AnalyzeRequest,
  signal: AbortSignal,
): Promise<Insight> {
  const chunks = splitIntoChunks(request.text, CHUNK_CHARS);
  const partials = await Promise.all(
    chunks.map((chunk, index) =>
      generateStructured(
        env,
        {
          systemInstruction: SYSTEM_INSTRUCTION,
          prompt: buildDocumentPrompt(chunk, { index, total: chunks.length }),
          signal,
        },
        aiInsightSchema,
      ),
    ),
  );

  const insight = await combinePartials(env, partials, signal);

  return insightSchema.parse({
    ...insight,
    document: { ...insight.document, fileName: request.fileName, pages: request.pages },
  });
}

async function combinePartials(
  env: Env,
  partials: AiInsight[],
  signal: AbortSignal,
): Promise<AiInsight> {
  const [first, ...rest] = partials;
  if (first && rest.length === 0) return first;

  const overview = await generateStructured(
    env,
    { systemInstruction: SYSTEM_INSTRUCTION, prompt: buildOverviewPrompt(partials), signal },
    overviewSchema,
  );
  return mergeInsights(partials, overview);
}
