import { describe, expect, it } from 'vitest';
import { POEMS } from '@/data/poems';
import { createSearchEntry, normalizeSearchQuery, searchPoems } from '@/lib/search';

const entries = POEMS.map(createSearchEntry);

describe('poem search', () => {
  it('trims and normalizes full-width characters with NFKC', () => {
    expect(normalizeSearchQuery('  １００  ')).toBe('100');
  });

  it.each([
    ['number', '１００', 100],
    ['upper poem', POEMS[16].kamiNoKu.slice(0, 4), 17],
    ['lower poem', POEMS[16].shimoNoKu.slice(0, 4), 17],
    ['upper kana', POEMS[16].kamiKana.slice(0, 5), 17],
    ['lower kana', POEMS[16].shimoKana.slice(0, 5), 17],
    ['author', POEMS[16].author, 17],
    ['author reading', POEMS[16].authorReading, 17],
    ['kimariji', POEMS[16].kimariJi, 17],
  ])('finds a poem by %s', (_field, query, expectedId) => {
    expect(searchPoems(entries, query)).toContain(expectedId);
  });

  it('returns all poems for an empty query and none for an unknown query', () => {
    expect(searchPoems(entries, '  ')).toHaveLength(100);
    expect(searchPoems(entries, '存在しない検索語')).toEqual([]);
  });
});
