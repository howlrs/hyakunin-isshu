'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Poem } from '@/data/types';
import { pickDistractors } from '@/lib/quiz';

export type QuizMode = 'upper-from-lower' | 'lower-from-upper';

interface Question {
  poem: Poem;
  mode: QuizMode;
  choices: Poem[];
}

const QUESTION_COUNT = 10;

function buildSession(allPoems: Poem[]): Question[] {
  // 100首からランダム10首を選ぶ (重複なし)
  const shuffled = [...allPoems].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, QUESTION_COUNT);

  return selected.map((poem) => {
    // 上の句↔下の句 をランダム選択
    const mode: QuizMode = Math.random() < 0.5 ? 'upper-from-lower' : 'lower-from-upper';
    const distractors = pickDistractors(poem, allPoems, 3);
    const choices = [poem, ...distractors].sort(() => Math.random() - 0.5);
    return { poem, mode, choices };
  });
}

interface Props {
  allPoems: Poem[];
}

export function QuizSession({ allPoems }: Props) {
  const [questions, setQuestions] = useState<Question[]>(() => buildSession(allPoems));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIdx];
  const isAnswered = pickedId !== null;
  const isCorrect = pickedId === current?.poem.id;

  const handlePick = (id: number) => {
    if (isAnswered) return;
    setPickedId(id);
    if (id === current.poem.id) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 >= QUESTION_COUNT) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setPickedId(null);
    }
  };

  const handleRestart = () => {
    setQuestions(buildSession(allPoems));
    setCurrentIdx(0);
    setPickedId(null);
    setCorrectCount(0);
    setFinished(false);
  };

  if (finished) {
    const percent = Math.round((correctCount / QUESTION_COUNT) * 100);
    const grade =
      percent >= 90
        ? '🏆 達人'
        : percent >= 70
          ? '🌸 優れた歌人'
          : percent >= 50
            ? '📖 学びの途中'
            : '🌱 これから';
    return (
      <div className="my-8 rounded-lg border border-koshoku/30 bg-washi p-8 text-center">
        <h2 className="mb-4 font-serif text-2xl font-bold text-sumi">結果</h2>
        <p className="mb-2 font-klee text-5xl text-shu">
          {correctCount} / {QUESTION_COUNT}
        </p>
        <p className="mb-6 font-sans text-koshoku">正解率 {percent}%</p>
        <p className="mb-6 font-serif text-xl text-sumi">{grade}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-full bg-shu px-6 py-2 font-sans text-washi transition hover:opacity-90"
          >
            もう一度
          </button>
          <Link
            href="/"
            className="rounded-full border border-koshoku/40 px-6 py-2 font-sans text-sumi transition hover:border-shu hover:text-shu"
          >
            一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const prompt =
    current.mode === 'lower-from-upper' ? current.poem.kamiNoKu : current.poem.shimoNoKu;
  const promptKana =
    current.mode === 'lower-from-upper' ? current.poem.kamiKana : current.poem.shimoKana;
  const getChoiceText = (p: Poem) =>
    current.mode === 'lower-from-upper' ? p.shimoNoKu : p.kamiNoKu;
  const getChoiceKana = (p: Poem) =>
    current.mode === 'lower-from-upper' ? p.shimoKana : p.kamiKana;

  return (
    <div className="my-8 space-y-6 rounded-lg border border-koshoku/30 bg-washi p-6">
      {/* 進捗バー */}
      <div className="flex items-center justify-between font-sans text-sm text-koshoku">
        <span>
          第 {currentIdx + 1} 問 / 全 {QUESTION_COUNT} 問
        </span>
        <span>
          現在のスコア: {correctCount} / {currentIdx + (isAnswered ? 1 : 0)}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-koshoku/20">
        <div
          className="h-full bg-shu transition-all"
          style={{ width: `${((currentIdx + (isAnswered ? 1 : 0)) / QUESTION_COUNT) * 100}%` }}
        />
      </div>

      {/* 出題 */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 font-sans text-xs font-bold ${
              current.mode === 'lower-from-upper'
                ? 'bg-shu/15 text-shu'
                : 'bg-koshoku/20 text-koshoku'
            }`}
          >
            {current.mode === 'lower-from-upper' ? '上の句 → 下の句' : '下の句 → 上の句'}
          </span>
          <span className="font-sans text-xs text-koshoku">
            {current.mode === 'lower-from-upper'
              ? '上の句に続く下の句を選んでください'
              : '下の句の前にくる上の句を選んでください'}
          </span>
        </div>
        <p className="font-klee text-xl text-sumi md:text-2xl">{prompt}</p>
        <small className="mt-1 block font-sans text-xs text-koshoku" aria-hidden="true">
          {promptKana}
        </small>
      </div>

      {/* 選択肢 */}
      <ul className="space-y-2">
        {current.choices.map((p) => {
          const state: 'idle' | 'correct' | 'wrong' = !isAnswered
            ? 'idle'
            : p.id === current.poem.id
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
                onClick={() => handlePick(p.id)}
                disabled={isAnswered}
                data-state={state}
                className={`flex w-full flex-col gap-1 rounded border px-4 py-3 text-left transition ${stateClasses}`}
              >
                <span className="font-klee">{getChoiceText(p)}</span>
                <small className="font-sans text-xs opacity-70" aria-hidden="true">
                  {getChoiceKana(p)}
                </small>
              </button>
            </li>
          );
        })}
      </ul>

      {/* 解答後フィードバック */}
      {isAnswered && (
        <div className="space-y-3">
          <p className="font-sans text-sm text-koshoku">
            {isCorrect ? '🌸 正解' : '✗ 不正解'} —
            <Link
              href={`/poems/${current.poem.slug}/`}
              className="ml-2 text-shu hover:underline"
            >
              第{current.poem.id}番（{current.poem.author}）の解説を見る →
            </Link>
          </p>
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full bg-shu px-6 py-2 font-sans text-washi transition hover:opacity-90"
          >
            {currentIdx + 1 >= QUESTION_COUNT ? '結果を見る' : '次の問題へ'}
          </button>
        </div>
      )}
    </div>
  );
}
