'use client';

import { useMemo, useState } from 'react';
import type { Poem } from '@/data/types';
import { pickDistractors } from '@/lib/quiz';

export type QuizMode = 'upper-from-lower' | 'lower-from-upper';

interface Props {
  correct: Poem;
  all: Poem[];
  mode: QuizMode;
}

export function Quiz({ correct, all, mode }: Props) {
  const distractors = useMemo(() => pickDistractors(correct, all, 3), [correct, all]);
  const choices = useMemo(() => {
    const arr = [correct, ...distractors];
    return arr.sort(() => Math.random() - 0.5);
  }, [correct, distractors]);

  const [pickedId, setPickedId] = useState<number | null>(null);

  const isAnswered = pickedId !== null;
  const prompt = mode === 'lower-from-upper' ? correct.kamiNoKu : correct.shimoNoKu;
  const promptLabel = mode === 'lower-from-upper' ? '上の句' : '下の句';
  const choiceLabel = mode === 'lower-from-upper' ? '下の句' : '上の句';
  const getChoiceText = (p: Poem) => (mode === 'lower-from-upper' ? p.shimoNoKu : p.kamiNoKu);

  return (
    <div className="my-4 space-y-4 rounded-lg border border-koshoku/30 bg-washi p-4">
      <p className="font-sans text-sm text-koshoku">
        {promptLabel}から{choiceLabel}を選んでください
      </p>
      <p className="font-klee text-lg text-sumi">{prompt}</p>
      <ul className="space-y-2">
        {choices.map((p) => {
          const state: 'idle' | 'correct' | 'wrong' = !isAnswered
            ? 'idle'
            : p.id === correct.id
              ? 'correct'
              : p.id === pickedId
                ? 'wrong'
                : 'idle';
          const stateClasses = {
            idle: 'border-koshoku/40 hover:border-shu',
            correct: 'border-green-700 bg-green-50 text-green-900',
            wrong: 'border-red-700 bg-red-50 text-red-900',
          }[state];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => !isAnswered && setPickedId(p.id)}
                disabled={isAnswered}
                data-state={state}
                className={`w-full rounded border px-3 py-2 text-left font-klee transition ${stateClasses}`}
              >
                {getChoiceText(p)}
              </button>
            </li>
          );
        })}
      </ul>
      {isAnswered && (
        <button
          type="button"
          onClick={() => setPickedId(null)}
          className="font-sans text-sm text-shu underline"
        >
          もう一度
        </button>
      )}
    </div>
  );
}
