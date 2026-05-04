import Link from 'next/link';
import type { Poem } from '@/data/types';
import { KimariBadge } from './KimariBadge';

export function PoemCard({ poem }: { poem: Poem }) {
  return (
    <Link
      href={`/poems/${poem.slug}/`}
      className="group flex flex-col gap-2 rounded-lg border border-koshoku/30 bg-washi p-4 transition hover:border-shu hover:shadow-md focus-visible:border-shu"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-sm text-koshoku">第{poem.id}番</span>
        <KimariBadge group={poem.kimariGroup} kimariJi={poem.kimariJi} />
      </div>
      <p className="font-klee text-lg leading-relaxed text-sumi group-hover:text-shu">
        {poem.kamiNoKu}
      </p>
      <p className="font-sans text-sm text-koshoku">{poem.author}</p>
    </Link>
  );
}
