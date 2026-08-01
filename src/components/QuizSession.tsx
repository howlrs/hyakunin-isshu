'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import type { Poem } from '@/data/types';
import { buildQuizQuestions, type QuizQuestion } from '@/lib/quiz';
import {
  getWeakPoemsServerSnapshot,
  getWeakPoemsSnapshot,
  parseWeakPoems,
  subscribeWeakPoems,
  writeWeakPoems,
} from '@/lib/weakPoems';

const QUESTION_COUNT = 10;
const subscribeToHydration = () => () => {};
const subscribeToLocation = (listener: () => void) => {
  window.addEventListener('popstate', listener);
  return () => window.removeEventListener('popstate', listener);
};
const getLocationSnapshot = () => window.location.search;
const getLocationServerSnapshot = () => '';

export function parsePoemParam(search: string): { id?: number; invalid: boolean } {
  const params = new URLSearchParams(search);
  if (!params.has('poem')) return { invalid: false };
  const value = params.get('poem') ?? '';
  if (!/^\d+$/.test(value)) return { invalid: true };
  const id = Number(value);
  return id >= 1 && id <= 100 ? { id, invalid: false } : { invalid: true };
}

interface Answer {
  poem: Poem;
  pickedId: number;
  isCorrect: boolean;
}

interface Props {
  allPoems: Poem[];
  random?: () => number;
}

export function QuizSession({ allPoems, random = Math.random }: Props) {
  const search = useSyncExternalStore(
    subscribeToLocation,
    getLocationSnapshot,
    getLocationServerSnapshot,
  );
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  if (!hydrated) {
    return (
      <div
        className="my-8 rounded-lg border border-koshoku/30 bg-washi p-8 text-center font-sans text-koshoku"
        role="status"
      >
        問題を用意しています…
      </div>
    );
  }

  const parsed = parsePoemParam(search);
  return (
    <QuizRunner
      key={parsed.id ? `single-${parsed.id}` : parsed.invalid ? 'invalid' : 'random'}
      allPoems={allPoems}
      random={random}
      initialPoemId={parsed.id}
      invalidPoemParam={parsed.invalid}
    />
  );
}

interface RunnerProps extends Props {
  initialPoemId?: number;
  invalidPoemParam: boolean;
}

type QuizSource = 'random' | 'single' | 'review' | 'weak';

function QuizRunner({
  allPoems,
  random = Math.random,
  initialPoemId,
  invalidPoemParam,
}: RunnerProps) {
  const initialPoem = initialPoemId
    ? allPoems.find((poem) => poem.id === initialPoemId)
    : undefined;
  const [source, setSource] = useState<QuizSource>(initialPoem ? 'single' : 'random');
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    buildQuizQuestions({
      targets: initialPoem ? [initialPoem] : allPoems,
      choicePool: allPoems,
      questionCount: initialPoem ? 1 : Math.min(QUESTION_COUNT, allPoems.length),
      random,
      fixedMode: initialPoem ? 'lower-from-upper' : undefined,
    }),
  );
  const weakRaw = useSyncExternalStore(
    subscribeWeakPoems,
    getWeakPoemsSnapshot,
    getWeakPoemsServerSnapshot,
  );
  const weakIds = parseWeakPoems(weakRaw).poemIds;
  const [storageMessage, setStorageMessage] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [finished, setFinished] = useState(false);

  const current = questions[currentIdx];
  const isAnswered = pickedId !== null;
  const isCorrect = pickedId === current?.poem.id;
  const correctCount = answers.filter((answer) => answer.isCorrect).length;

  const startQuestions = (nextQuestions: QuizQuestion[], nextSource: QuizSource) => {
    setSource(nextSource);
    setQuestions(nextQuestions);
    setCurrentIdx(0);
    setPickedId(null);
    setAnswers([]);
    setFinished(false);
  };

  const handlePick = (id: number) => {
    if (isAnswered || !current) return;
    setPickedId(id);
    setAnswers((history) => [
      ...history,
      { poem: current.poem, pickedId: id, isCorrect: id === current.poem.id },
    ]);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setPickedId(null);
    }
  };

  const handleRestart = () => {
    startQuestions(
      buildQuizQuestions({
        targets: allPoems,
        choicePool: allPoems,
        questionCount: Math.min(QUESTION_COUNT, allPoems.length),
        random,
      }),
      'random',
    );
  };

  const handleSingleRestart = () => {
    if (!initialPoem) return;
    startQuestions(
      buildQuizQuestions({
        targets: [initialPoem],
        choicePool: allPoems,
        questionCount: 1,
        random,
        fixedMode: 'lower-from-upper',
      }),
      'single',
    );
  };

  const handleReview = (wrongPoems: Poem[]) => {
    startQuestions(
      buildQuizQuestions({
        targets: wrongPoems,
        choicePool: allPoems,
        questionCount: wrongPoems.length,
        random,
      }),
      'review',
    );
  };

  const handleWeakReview = () => {
    const targets = allPoems.filter((poem) => weakIds.includes(poem.id));
    startQuestions(
      buildQuizQuestions({
        targets,
        choicePool: allPoems,
        questionCount: Math.min(QUESTION_COUNT, targets.length),
        random,
      }),
      'weak',
    );
  };

  const addWrongToWeak = (wrongPoems: Poem[]) => {
    try {
      writeWeakPoems((ids) => [...ids, ...wrongPoems.map((poem) => poem.id)]);
      setStorageMessage(`間違えた${wrongPoems.length}首を苦手札に追加しました`);
    } catch {
      setStorageMessage('苦手札を保存できませんでした。クイズは続けられます。');
    }
  };

  const clearWeak = () => {
    if (!window.confirm('苦手札をすべて消去しますか？')) return;
    try {
      writeWeakPoems(() => []);
      setStorageMessage('苦手札をすべて消去しました');
    } catch {
      setStorageMessage('苦手札を消去できませんでした。');
    }
  };

  if (finished) {
    const questionCount = questions.length;
    const wrongPoems = answers.filter((answer) => !answer.isCorrect).map((answer) => answer.poem);
    const percent = questionCount === 0 ? 0 : Math.round((correctCount / questionCount) * 100);
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
          {correctCount} / {questionCount}
        </p>
        <p className="mb-6 font-sans text-koshoku">正解率 {percent}%</p>
        <p className="mb-6 font-serif text-xl text-sumi">{grade}</p>
        {wrongPoems.length > 0 ? (
          <section className="mb-8 text-left" aria-labelledby="wrong-poems-heading">
            <h3 id="wrong-poems-heading" className="mb-3 font-serif text-xl font-bold text-sumi">
              間違えた歌
            </h3>
            <ul className="space-y-3">
              {wrongPoems.map((poem) => (
                <li
                  key={poem.id}
                  className="rounded border border-koshoku/25 bg-white/50 px-4 py-3"
                >
                  <p className="font-sans text-sm font-bold text-koshoku">
                    第{poem.id}番　{poem.author}
                  </p>
                  <p className="mt-1 font-klee text-sumi">{poem.kamiNoKu}</p>
                  <p className="font-klee text-sumi">{poem.shimoNoKu}</p>
                  <Link
                    href={`/poems/${poem.slug}/`}
                    className="mt-2 inline-block font-sans text-sm text-shu hover:underline"
                  >
                    この歌の解説を見る →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="mb-8 font-serif text-lg text-sumi">
            全問正解です。すべての歌を見事に答えました！
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          {wrongPoems.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => handleReview(wrongPoems)}
                className="rounded-full border border-shu bg-shu/10 px-6 py-2 font-sans text-shu transition hover:bg-shu hover:text-washi"
              >
                間違えた{wrongPoems.length}首を復習
              </button>
              <button
                type="button"
                onClick={() => addWrongToWeak(wrongPoems)}
                className="rounded-full border border-koshoku/40 px-6 py-2 font-sans text-sumi transition hover:border-shu hover:text-shu"
              >
                間違えた{wrongPoems.length}首を苦手札に追加
              </button>
            </>
          )}
          {source === 'single' && initialPoem && (
            <button
              type="button"
              onClick={handleSingleRestart}
              className="rounded-full border border-shu px-6 py-2 font-sans text-shu"
            >
              同じ一首をもう一度
            </button>
          )}
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-full bg-shu px-6 py-2 font-sans text-washi transition hover:opacity-90"
          >
            新しい{Math.min(QUESTION_COUNT, allPoems.length)}問に挑戦
          </button>
          {source === 'single' && initialPoem && (
            <Link
              href={`/poems/${initialPoem.slug}/`}
              className="rounded-full border border-koshoku/40 px-6 py-2 font-sans text-sumi transition hover:border-shu hover:text-shu"
            >
              この歌の詳細へ戻る
            </Link>
          )}
          <Link
            href="/"
            className="rounded-full border border-koshoku/40 px-6 py-2 font-sans text-sumi transition hover:border-shu hover:text-shu"
          >
            一覧へ戻る
          </Link>
        </div>
        {storageMessage && (
          <p className="mt-4 font-sans text-sm text-koshoku" role="status" aria-live="polite">
            {storageMessage}
          </p>
        )}
      </div>
    );
  }

  if (!current) {
    return (
      <div
        className="my-8 rounded-lg border border-koshoku/30 bg-washi p-8 text-center font-sans text-koshoku"
        role="status"
      >
        出題できる歌がありません。
      </div>
    );
  }

  const prompt =
    current.mode === 'lower-from-upper' ? current.poem.kamiNoKu : current.poem.shimoNoKu;
  const promptKana =
    current.mode === 'lower-from-upper' ? current.poem.kamiKana : current.poem.shimoKana;
  const getChoiceText = (p: Poem) =>
    current.mode === 'lower-from-upper' ? p.shimoNoKu : p.kamiNoKu;
  const getChoiceKana = (p: Poem) =>
    current.mode === 'lower-from-upper' ? p.shimoKana : p.kamiKana;

  return (
    <>
      <section className="my-6 rounded-lg border border-koshoku/30 bg-washi p-4">
        {invalidPoemParam && (
          <p className="mb-3 font-sans text-sm text-shu" role="status">
            指定された歌番号が不正なため、ランダム10問を開始しました。
          </p>
        )}
        <p className="font-sans text-sm text-koshoku" aria-live="polite">
          苦手札: {weakIds.length}首
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleWeakReview}
            disabled={weakIds.length === 0}
            className="rounded-full border border-shu px-4 py-2 font-sans text-sm text-shu disabled:cursor-not-allowed disabled:opacity-40"
          >
            苦手札から復習
          </button>
          <button
            type="button"
            onClick={clearWeak}
            disabled={weakIds.length === 0}
            className="rounded-full border border-koshoku/40 px-4 py-2 font-sans text-sm text-sumi disabled:cursor-not-allowed disabled:opacity-40"
          >
            苦手札を全件クリア
          </button>
        </div>
        {weakIds.length === 0 && (
          <p className="mt-2 font-sans text-sm text-koshoku">苦手札はありません</p>
        )}
        {storageMessage && (
          <p className="sr-only" role="status" aria-live="polite">
            {storageMessage}
          </p>
        )}
      </section>
      <div className="my-8 space-y-6 rounded-lg border border-koshoku/30 bg-washi p-6">
        {/* 進捗バー */}
        <div className="flex flex-wrap items-center justify-between gap-2 font-sans text-sm text-koshoku">
          <span>
            第 {currentIdx + 1} 問 / 全 {questions.length} 問
          </span>
          <span>正解: {correctCount}問</span>
        </div>
        <div
          className="h-1 overflow-hidden rounded-full bg-koshoku/20"
          role="progressbar"
          aria-label="クイズの進捗"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={currentIdx + (isAnswered ? 1 : 0)}
        >
          <div
            className="h-full bg-shu transition-all"
            style={{
              width: `${((currentIdx + (isAnswered ? 1 : 0)) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* 出題 */}
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
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
          <p className="font-klee text-xl text-sumi md:text-2xl" data-testid="quiz-prompt">
            {prompt}
          </p>
          {source === 'single' && (
            <p className="mt-2 font-sans text-sm text-koshoku">
              第{current.poem.id}番　{current.poem.author}
            </p>
          )}
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
            <p className="font-sans text-sm text-koshoku" role="status" aria-live="polite">
              {isCorrect ? '🌸 正解' : '✗ 不正解'} — 正解は「{getChoiceText(current.poem)}」です —
              <Link href={`/poems/${current.poem.slug}/`} className="ml-2 text-shu hover:underline">
                第{current.poem.id}番（{current.poem.author}）の解説を見る →
              </Link>
            </p>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-shu px-6 py-2 font-sans text-washi transition hover:opacity-90"
            >
              {currentIdx + 1 >= questions.length ? '結果を見る' : '次の問題へ'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
