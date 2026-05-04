import { describe, it, expect } from 'vitest';
import { POEMS } from '@/data/poems';
import { pickDistractors } from '@/lib/quiz';

describe('pickDistractors', () => {
  const correct = POEMS[0];

  it('returns exactly 3 distractors by default', () => {
    const distractors = pickDistractors(correct, POEMS, 3, () => 0.5);
    expect(distractors).toHaveLength(3);
  });

  it('does not include the correct poem', () => {
    const distractors = pickDistractors(correct, POEMS, 3, () => 0.5);
    expect(distractors.find((p) => p.id === correct.id)).toBeUndefined();
  });

  it('returns unique poems (no duplicates)', () => {
    const distractors = pickDistractors(correct, POEMS, 3, () => 0.5);
    const ids = distractors.map((p) => p.id);
    expect(new Set(ids).size).toBe(distractors.length);
  });

  it('handles count = 0', () => {
    const distractors = pickDistractors(correct, POEMS, 0, () => 0.5);
    expect(distractors).toEqual([]);
  });

  it('falls back gracefully when not enough same-theme poems', () => {
    const small = POEMS.slice(0, 5);
    const distractors = pickDistractors(small[0], small, 3, () => 0.5);
    expect(distractors.length).toBeLessThanOrEqual(3);
    expect(distractors.find((p) => p.id === small[0].id)).toBeUndefined();
  });
});
