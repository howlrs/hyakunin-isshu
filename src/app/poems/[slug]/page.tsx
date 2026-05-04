import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPoems, getPoemBySlug } from '@/lib/poems';
import { getRelatedPoems } from '@/lib/relations';
import { ERA_LABELS, THEME_LABELS } from '@/data/types';
import { PoemBody } from '@/components/PoemBody';
import { PoemImage } from '@/components/PoemImage';
import { KimariBadge } from '@/components/KimariBadge';
import { Quiz } from '@/components/Quiz';
import { RelatedPoemsSection } from '@/components/RelatedPoemsSection';
import { JsonLd } from '@/components/JsonLd';

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

export default async function PoemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const poem = getPoemBySlug(slug);
  if (!poem) notFound();

  const all = getAllPoems();
  const related = getRelatedPoems(poem, all);

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
          <h1 className="font-klee text-2xl text-sumi md:text-3xl">{poem.kamiNoKu}</h1>
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

        <section className="my-8">
          <h2 className="mb-4 font-sans text-xl font-bold text-sumi">クイズで覚える</h2>
          <Quiz correct={poem} all={all} mode="lower-from-upper" />
          <Quiz correct={poem} all={all} mode="upper-from-lower" />
        </section>

        <RelatedPoemsSection related={related} target={poem} />
      </article>
    </main>
  );
}
