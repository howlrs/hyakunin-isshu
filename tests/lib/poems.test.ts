import { describe, it, expect } from 'vitest';
import { getAllPoems, getPoemBySlug, getPoemById } from '@/lib/poems';

describe('lib/poems', () => {
  it('getAllPoems returns 100 poems', () => {
    expect(getAllPoems()).toHaveLength(100);
  });

  it('getPoemById returns matching poem', () => {
    const p = getPoemById(1);
    expect(p?.id).toBe(1);
  });

  it('getPoemById returns undefined for missing id', () => {
    expect(getPoemById(999)).toBeUndefined();
  });

  it('getPoemBySlug returns matching poem', () => {
    const p = getPoemBySlug('1-akinotano');
    expect(p?.id).toBe(1);
  });

  it('getPoemBySlug returns undefined for missing slug', () => {
    expect(getPoemBySlug('not-exist')).toBeUndefined();
  });
});
