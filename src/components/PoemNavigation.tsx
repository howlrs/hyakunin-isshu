import Link from 'next/link';
import type { Poem } from '@/data/types';

interface Props {
  prev?: Poem;
  next?: Poem;
}

export function PoemNavigation({ prev, next }: Props) {
  return (
    <nav
      className="my-8 grid gap-3 sm:grid-cols-2"
      aria-label="前後の句への移動"
    >
      {prev ? (
        <Link
          href={`/poems/${prev.slug}/`}
          rel="prev"
          className="group flex flex-col gap-1 rounded-lg border border-koshoku/30 bg-washi p-4 text-left transition hover:border-shu hover:shadow-md"
        >
          <span className="font-sans text-xs text-koshoku">← 第{prev.id}番</span>
          <span className="font-klee text-sumi group-hover:text-shu">{prev.kamiNoKu}</span>
          <span className="font-sans text-xs text-koshoku">{prev.author}</span>
        </Link>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
      {next ? (
        <Link
          href={`/poems/${next.slug}/`}
          rel="next"
          className="group flex flex-col gap-1 rounded-lg border border-koshoku/30 bg-washi p-4 text-right transition hover:border-shu hover:shadow-md sm:items-end"
        >
          <span className="font-sans text-xs text-koshoku">第{next.id}番 →</span>
          <span className="font-klee text-sumi group-hover:text-shu">{next.kamiNoKu}</span>
          <span className="font-sans text-xs text-koshoku">{next.author}</span>
        </Link>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}
    </nav>
  );
}
