import type { Poem } from '@/data/types';

export type QuizMode = 'upper-from-lower' | 'lower-from-upper';

export interface QuizQuestion {
  poem: Poem;
  mode: QuizMode;
  choices: Poem[];
}

export interface BuildQuizQuestionsOptions {
  /** 出題対象。復習時は誤答した歌だけを渡す。 */
  targets: Poem[];
  /** ダミー選択肢の候補。復習時も全100首を渡せるよう対象と分離する。 */
  choicePool: Poem[];
  questionCount?: number;
  random?: () => number;
  fixedMode?: QuizMode;
}

/** Fisher–Yates 法で、元配列を変更せずにシャッフルする。 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * クイズのダミー選択肢を抽出する。
 *
 * 比率 (count=3 の場合):
 * - 60% 同テーマから (適度な紛らわしさ・学習効果あり)
 * - 30% ランダム (一般識別力)
 * - 10% 同決まり字グループから (時々入る難問)
 *
 * 上記比率を満たせない場合は、残り枠をランダムプールから補充する。
 *
 * @param random テスト容易性のため Math.random を注入可能にする
 */
export function pickDistractors(
  correct: Poem,
  all: Poem[],
  count = 3,
  random: () => number = Math.random,
): Poem[] {
  if (count <= 0) return [];

  const candidates = [
    ...new Map(
      all.filter((poem) => poem.id !== correct.id).map((poem) => [poem.id, poem]),
    ).values(),
  ];
  if (candidates.length === 0) return [];

  const sameThemePool = candidates.filter((p) => p.themes.some((t) => correct.themes.includes(t)));
  const sameKimariPool = candidates.filter((p) => p.kimariGroup === correct.kimariGroup);

  const themeQuota = Math.round(count * 0.6);
  const kimariQuota = Math.max(0, Math.round(count * 0.1));
  const randomQuota = count - themeQuota - kimariQuota;

  const picked: Poem[] = [];
  const pickedIds = new Set<number>();

  function pickFromPool(pool: Poem[], n: number) {
    const available = pool.filter((p) => !pickedIds.has(p.id));
    const shuffled = shuffle(available, random);
    for (const p of shuffled.slice(0, n)) {
      picked.push(p);
      pickedIds.add(p.id);
    }
  }

  pickFromPool(sameThemePool, themeQuota);
  pickFromPool(sameKimariPool, kimariQuota);
  pickFromPool(candidates, randomQuota);

  if (picked.length < count) {
    pickFromPool(candidates, count - picked.length);
  }

  return picked.slice(0, count);
}

/**
 * 出題対象と選択肢候補を分離してクイズを構築する。
 * 同じ歌は1回だけ出題され、各問の選択肢には正解がちょうど1件含まれる。
 */
export function buildQuizQuestions({
  targets,
  choicePool,
  questionCount = targets.length,
  random = Math.random,
  fixedMode,
}: BuildQuizQuestionsOptions): QuizQuestion[] {
  const uniqueTargets = [...new Map(targets.map((poem) => [poem.id, poem])).values()];
  const count = Math.max(0, Math.min(questionCount, uniqueTargets.length));
  const selected = shuffle(uniqueTargets, random).slice(0, count);

  return selected.map((poem) => {
    const mode: QuizMode = fixedMode ?? (random() < 0.5 ? 'upper-from-lower' : 'lower-from-upper');
    const distractors = pickDistractors(poem, choicePool, 3, random);
    const choices = shuffle([poem, ...distractors], random);
    return { poem, mode, choices };
  });
}
