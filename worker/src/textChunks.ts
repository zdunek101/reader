/** Dzieli tekst na fragmenty nie dłuższe niż `maxChars`, preferując granice akapitów. */
export function splitIntoChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const paragraph of text.split(/\n{2,}/)) {
    for (const piece of sliceByLength(paragraph, maxChars)) {
      if (current && current.length + piece.length + 2 > maxChars) {
        chunks.push(current);
        current = '';
      }
      current = current ? `${current}\n\n${piece}` : piece;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function sliceByLength(text: string, maxChars: number): string[] {
  const slices: string[] = [];
  for (let start = 0; start < text.length; start += maxChars) {
    slices.push(text.slice(start, start + maxChars));
  }
  return slices;
}
