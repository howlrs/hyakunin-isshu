import { describe, it, expect } from 'vitest';
import { POEMS } from '@/data/poems';
import { getRelatedPoems } from '@/lib/relations';

describe('getRelatedPoems', () => {
  const target = POEMS[0];

  it('does not include the target poem in any list', () => {
    const r = getRelatedPoems(target, POEMS);
    const allRelated = [
      ...r.sameAuthor,
      ...r.sameTheme.flatMap((s) => s.poems),
      ...r.sameKimariGroup,
      ...r.sameEra,
    ];
    expect(allRelated.find((p) => p.id === target.id)).toBeUndefined();
  });

  it('returns at most 4 poems per axis', () => {
    const r = getRelatedPoems(target, POEMS);
    expect(r.sameAuthor.length).toBeLessThanOrEqual(4);
    expect(r.sameKimariGroup.length).toBeLessThanOrEqual(4);
    expect(r.sameEra.length).toBeLessThanOrEqual(4);
    for (const s of r.sameTheme) {
      expect(s.poems.length).toBeLessThanOrEqual(4);
    }
  });

  it('sameAuthor returns only poems by the same author', () => {
    const r = getRelatedPoems(target, POEMS);
    for (const p of r.sameAuthor) {
      expect(p.author).toBe(target.author);
    }
  });

  it('sameKimariGroup returns only poems with the same kimariGroup', () => {
    const r = getRelatedPoems(target, POEMS);
    for (const p of r.sameKimariGroup) {
      expect(p.kimariGroup).toBe(target.kimariGroup);
    }
  });

  it('sameEra returns only poems from the same era', () => {
    const r = getRelatedPoems(target, POEMS);
    for (const p of r.sameEra) {
      expect(p.era).toBe(target.era);
    }
  });
});
