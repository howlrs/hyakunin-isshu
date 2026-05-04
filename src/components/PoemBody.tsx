import type { Poem } from '@/data/types';

export function PoemBody({ poem }: { poem: Poem }) {
  return (
    <section
      className="poem-vertical mx-auto my-8 flex max-h-[60vh] flex-row-reverse gap-8 overflow-x-auto px-4 py-6 font-klee text-2xl leading-loose md:text-3xl"
      aria-label={`${poem.kamiNoKu} ${poem.shimoNoKu}`}
    >
      <p className="whitespace-nowrap" aria-hidden="true">
        {poem.kamiNoKu}
      </p>
      <p className="whitespace-nowrap" aria-hidden="true">
        {poem.shimoNoKu}
      </p>
      <span className="sr-only">
        {poem.kamiKana} {poem.shimoKana}
      </span>
    </section>
  );
}
