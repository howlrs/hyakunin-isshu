import type { Poem } from '@/data/types';

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

  const candidates = all.filter((p) => p.id !== correct.id);
  if (candidates.length === 0) return [];

  const sameThemePool = candidates.filter((p) =>
    p.themes.some((t) => correct.themes.includes(t)),
  );
  const sameKimariPool = candidates.filter((p) => p.kimariGroup === correct.kimariGroup);

  const themeQuota = Math.round(count * 0.6);
  const kimariQuota = Math.max(0, Math.round(count * 0.1));
  const randomQuota = count - themeQuota - kimariQuota;

  const picked: Poem[] = [];
  const pickedIds = new Set<number>();

  function pickFromPool(pool: Poem[], n: number) {
    const available = pool.filter((p) => !pickedIds.has(p.id));
    const shuffled = [...available].sort(() => random() - 0.5);
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
