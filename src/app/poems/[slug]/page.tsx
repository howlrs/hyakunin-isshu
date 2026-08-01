import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPoems, getPoemBySlug, getPoemById } from '@/lib/poems';
import { getRelatedPoems } from '@/lib/relations';
import { ERA_LABELS, THEME_LABELS } from '@/data/types';
import { PoemBody } from '@/components/PoemBody';
import { PoemImage } from '@/components/PoemImage';
import { PoemNavigation } from '@/components/PoemNavigation';
import { PoemReading } from '@/components/PoemReading';
import { KimariBadge } from '@/components/KimariBadge';
import { RelatedPoemsSection } from '@/components/RelatedPoemsSection';
import { JsonLd } from '@/components/JsonLd';
import { WeakPoemToggle } from '@/components/WeakPoemToggle';

export async function generateStaticParams() {
  return getAllPoems().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const poem = getPoemBySlug(slug);
  if (!poem) return {};
  const description = `${poem.kamiNoKu} ${poem.shimoNoKu}。${poem.scene.slice(0, 80)}…`;
  return {
    title: `${poem.kamiNoKu}（${poem.author}・第${poem.id}番）`,
    description,
    alternates: { canonical: `/poems/${poem.slug}/` },
    openGraph: {
      title: `${poem.kamiNoKu}（${poem.author}）`,
      description: poem.meaning,
      type: 'article',
      images: [
        {
          url: `/images/og/${poem.slug}.webp`,
          width: 1280,
          height: 720,
          alt: `${poem.kamiNoKu} ${poem.shimoNoKu}（${poem.author}）`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${poem.kamiNoKu}（${poem.author}）`,
      description: poem.meaning,
      images: [`/images/og/${poem.slug}.webp`],
    },
  };
}

export default async function PoemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const poem = getPoemBySlug(slug);
  if (!poem) notFound();

  const all = getAllPoems();
  const related = getRelatedPoems(poem, all);
  const prevPoem = getPoemById(poem.id - 1);
  const nextPoem = getPoemById(poem.id + 1);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${poem.kamiNoKu}(${poem.author}・第${poem.id}番)`,
    author: { '@type': 'Person', name: poem.author },
    inLanguage: 'ja',
    isPartOf: { '@type': 'CreativeWorkSeries', name: '百人一首' },
    citation: {
      '@type': 'Quotation',
      text: `${poem.kamiNoKu} / ${poem.shimoNoKu}`,
    },
  };

  return (
    <main id="main-content" className="container mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={articleLd} />

      <nav className="mb-6 font-sans text-sm">
        <Link href="/" className="text-koshoku hover:text-shu hover:underline">
          ← 一覧へ戻る
        </Link>
      </nav>

      <article>
        <header className="mb-6 space-y-3">
          <h1 className="font-klee text-2xl text-sumi md:text-3xl">
            {poem.kamiNoKu}
            <small
              className="mt-1 block font-sans text-sm font-normal text-koshoku"
              aria-hidden="true"
            >
              {poem.kamiKana}
            </small>
          </h1>
          <h2 className="font-sans text-base text-koshoku">
            第{poem.id}番 {poem.author}
            <span className="ml-2 text-sm">({poem.authorReading})</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <KimariBadge group={poem.kimariGroup} kimariJi={poem.kimariJi} />
            <span className="rounded-full border border-koshoku/40 px-2 py-0.5 font-sans text-xs text-koshoku">
              {ERA_LABELS[poem.era]}
            </span>
            {poem.themes.map((t) => (
              <span
                key={t}
                className="rounded-full border border-koshoku/40 px-2 py-0.5 font-sans text-xs text-koshoku"
              >
                {THEME_LABELS[t]}
              </span>
            ))}
          </div>
        </header>

        <PoemBody poem={poem} />

        <PoemImage poem={poem} />

        <PoemReading poem={poem} />

        <section className="my-8">
          <h2 className="mb-2 font-sans text-xl font-bold text-sumi">いつ・誰が</h2>
          <p className="leading-loose text-sumi">{poem.whoWhen}</p>
        </section>

        <section className="my-8">
          <h2 className="mb-2 font-sans text-xl font-bold text-sumi">情景</h2>
          <p className="leading-loose text-sumi">{poem.scene}</p>
        </section>

        <section className="my-8">
          <h2 className="mb-2 font-sans text-xl font-bold text-sumi">意味</h2>
          <p className="leading-loose text-sumi">{poem.meaning}</p>
        </section>

        <aside className="my-8 rounded-lg border border-koshoku/30 bg-washi p-4 text-center">
          <p className="font-sans text-sm text-koshoku">この句を含むクイズに挑戦しよう</p>
          <Link
            href={`/quiz/?poem=${poem.id}`}
            className="mt-2 inline-block rounded-full bg-shu px-6 py-2 font-sans text-sm text-washi transition hover:opacity-90"
          >
            この一首を稽古する →
          </Link>
          <WeakPoemToggle poemId={poem.id} />
        </aside>

        <PoemNavigation prev={prevPoem} next={nextPoem} />

        <RelatedPoemsSection related={related} target={poem} />
      </article>
    </main>
  );
}
