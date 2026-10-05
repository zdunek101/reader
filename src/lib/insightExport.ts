import type { Insight } from './schema';

export function insightToJson(insight: Insight): string {
  return JSON.stringify(insight, null, 2);
}

export function downloadInsightJson(insight: Insight): void {
  const blob = new Blob([insightToJson(insight)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${insight.document.fileName.replace(/\.pdf$/i, '')}.insight.json`;
  link.click();
  URL.revokeObjectURL(url);
}
