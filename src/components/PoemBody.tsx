import type { Poem } from '@/data/types';

export function PoemBody({ poem }: { poem: Poem }) {
  return (
    <section
      className="poem-vertical mx-auto my-8 flex flex-col items-end gap-8 px-4 py-6 font-klee text-2xl leading-loose md:text-3xl"
      role="group"
      aria-label={`${poem.kamiNoKu} ${poem.shimoNoKu}`}
    >
      <p aria-hidden="true">{poem.kamiNoKu}</p>
      <p aria-hidden="true">{poem.shimoNoKu}</p>
      <span className="sr-only">
        {poem.kamiKana} {poem.shimoKana}
      </span>
    </section>
  );
}
