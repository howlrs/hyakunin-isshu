import type { Poem } from '@/data/types';

export interface PoemSearchEntry {
  id: number;
  text: string;
}

export type SearchablePoem = Pick<
  Poem,
  | 'id'
  | 'kamiNoKu'
  | 'shimoNoKu'
  | 'kamiKana'
  | 'shimoKana'
  | 'author'
  | 'authorReading'
  | 'kimariJi'
>;

export function normalizeSearchQuery(value: string): string {
  return value.trim().normalize('NFKC').toLocaleLowerCase('ja');
}

export function createSearchEntry(poem: SearchablePoem): PoemSearchEntry {
  return {
    id: poem.id,
    text: normalizeSearchQuery(
      [
        poem.id,
        poem.kamiNoKu,
        poem.shimoNoKu,
        poem.kamiKana,
        poem.shimoKana,
        poem.author,
        poem.authorReading,
        poem.kimariJi,
      ].join('\n'),
    ),
  };
}

export function searchPoems(entries: readonly PoemSearchEntry[], value: string): number[] {
  const query = normalizeSearchQuery(value);
  if (!query) return entries.map((entry) => entry.id);
  return entries.filter((entry) => entry.text.includes(query)).map((entry) => entry.id);
}
