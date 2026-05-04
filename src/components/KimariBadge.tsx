import { KIMARI_LABELS, type KimariGroup } from '@/data/types';

const STYLE_BY_GROUP: Record<KimariGroup, string> = {
  ichiji: 'bg-shu text-washi',
  niji: 'border border-shu text-shu',
  sanji: 'border border-koshoku text-sumi',
  yonji: 'border border-koshoku text-sumi',
  goji: 'border border-koshoku text-sumi',
  rokuji: 'border border-koshoku text-sumi',
  shichiji: 'border border-koshoku text-sumi',
};

export function KimariBadge({ group, kimariJi }: { group: KimariGroup; kimariJi: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-sans ${STYLE_BY_GROUP[group]}`}
      aria-label={`${KIMARI_LABELS[group]} 「${kimariJi}」`}
    >
      <span className="font-bold">{KIMARI_LABELS[group]}</span>
      <span>「{kimariJi}」</span>
    </span>
  );
}
