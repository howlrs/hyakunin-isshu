import Image from 'next/image';
import type { Poem } from '@/data/types';

export function PoemImage({ poem }: { poem: Poem }) {
  return (
    <figure className="my-8 overflow-hidden rounded-lg border border-koshoku/30 bg-washi">
      <Image
        src={`/images/poems/${poem.slug}.webp`}
        alt={`${poem.kamiNoKu} ${poem.shimoNoKu}（${poem.author}）の情景`}
        width={1280}
        height={720}
        className="h-auto w-full"
        priority={false}
      />
      <figcaption className="px-3 py-2 font-sans text-xs text-koshoku">
        情景イメージ — Gemini生成
      </figcaption>
    </figure>
  );
}
