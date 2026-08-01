import { describe, it, expect } from 'vitest';
import { POEMS } from '@/data/poems';
import { buildQuizQuestions, pickDistractors, shuffle } from '@/lib/quiz';

describe('shuffle', () => {
  it('does not mutate the source array', () => {
    const source = [1, 2, 3, 4];
    shuffle(source, () => 0);
    expect(source).toEqual([1, 2, 3, 4]);
  });
});

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

  it('deduplicates candidates with the same poem id', () => {
    const duplicatedPool = [correct, POEMS[1], POEMS[1], POEMS[2], POEMS[3]];
    const distractors = pickDistractors(correct, duplicatedPool, 3, () => 0);
    const ids = distractors.map((poem) => poem.id);

    expect(distractors).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
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

describe('buildQuizQuestions', () => {
  it('supports a fixed upper-to-lower direction for single-poem practice', () => {
    const [question] = buildQuizQuestions({
      targets: [POEMS[16]],
      choicePool: POEMS,
      questionCount: 1,
      fixedMode: 'lower-from-upper',
      random: () => 0,
    });
    expect(question.poem.id).toBe(17);
    expect(question.mode).toBe('lower-from-upper');
    expect(question.choices).toHaveLength(4);
    expect(question.choices.filter((choice) => choice.id === 17)).toHaveLength(1);
  });
  it('limits questions to the target poems while using the full choice pool', () => {
    const targets = [POEMS[9], POEMS[19]];
    const questions = buildQuizQuestions({
      targets,
      choicePool: POEMS,
      random: () => 0,
    });

    expect(questions).toHaveLength(2);
    expect(questions.map((question) => question.poem.id).sort((a, b) => a - b)).toEqual([10, 20]);
    expect(
      questions.flatMap((question) => question.choices).some((poem) => ![10, 20].includes(poem.id)),
    ).toBe(true);
  });

  it('supports a quiz with fewer than 10 questions', () => {
    const questions = buildQuizQuestions({
      targets: POEMS.slice(0, 2),
      choicePool: POEMS,
      questionCount: 2,
      random: () => 0.25,
    });

    expect(questions).toHaveLength(2);
  });

  it('includes the correct poem exactly once in every question', () => {
    const questions = buildQuizQuestions({
      targets: POEMS.slice(0, 10),
      choicePool: POEMS,
      questionCount: 10,
      random: () => 0.5,
    });

    for (const question of questions) {
      expect(question.choices.filter((choice) => choice.id === question.poem.id)).toHaveLength(1);
      expect(question.choices).toHaveLength(4);
    }
  });
});
