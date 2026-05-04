import Image from 'next/image';
import Link from 'next/link';
import type { Poem } from '@/data/types';
import { KimariBadge } from './KimariBadge';

export function PoemCard({ poem }: { poem: Poem }) {
  return (
    <Link
      href={`/poems/${poem.slug}/`}
      className="group flex flex-col overflow-hidden rounded-lg border border-koshoku/30 bg-washi transition hover:border-shu hover:shadow-md focus-visible:border-shu"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-washi">
        <Image
          src={`/images/poems/${poem.slug}.webp`}
          alt={`${poem.kamiNoKu}（${poem.author}）の情景`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-sans text-sm text-koshoku">第{poem.id}番</span>
          <KimariBadge group={poem.kimariGroup} kimariJi={poem.kimariJi} />
        </div>
        <p className="font-klee text-lg leading-relaxed text-sumi group-hover:text-shu">
          {poem.kamiNoKu}
        </p>
        <p className="font-sans text-sm text-koshoku">{poem.author}</p>
      </div>
    </Link>
  );
}
