import { describe, expect, it } from 'vitest';
import { splitIntoChunks } from './textChunks';

describe('splitIntoChunks', () => {
  it('zwraca krótki tekst jako jeden fragment', () => {
    expect(splitIntoChunks('Akapit 1\n\nAkapit 2', 100)).toEqual(['Akapit 1\n\nAkapit 2']);
  });

  it('dzieli na granicach akapitów', () => {
    const text = ['a'.repeat(40), 'b'.repeat(40), 'c'.repeat(40)].join('\n\n');
    expect(splitIntoChunks(text, 90)).toEqual([
      `${'a'.repeat(40)}\n\n${'b'.repeat(40)}`,
      'c'.repeat(40),
    ]);
  });

  it('tnie akapit dłuższy niż limit i nie gubi tekstu', () => {
    const text = 'x'.repeat(250);
    const chunks = splitIntoChunks(text, 100);
    expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true);
    expect(chunks.join('')).toBe(text);
  });
});
