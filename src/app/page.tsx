import Image from 'next/image';
import Link from 'next/link';
import { getAllPoems } from '@/lib/poems';
import { JsonLd } from '@/components/JsonLd';
import { KimariBadge } from '@/components/KimariBadge';

export const metadata = {
  title: '百人一首 100首 一覧',
  description:
    '百人一首100首を、情景を味わいながら覚えるためのWebアプリ。番号順・決まり字・作者・テーマ・時代で並び替えできます。',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const poems = getAllPoems();
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '百人一首 100首',
    numberOfItems: poems.length,
    itemListElement: poems.map((p) => ({
      '@type': 'ListItem',
      position: p.id,
      url: `/poems/${p.slug}/`,
      name: `${p.kamiNoKu}（${p.author}・第${p.id}番）`,
    })),
  };

  return (
    <main id="main-content" className="container mx-auto max-w-5xl px-4 py-8">
      <JsonLd data={itemList} />
      <header className="mb-8">
        <Image
          src="/images/hero.webp"
          alt="百人一首 — 四季を彩る絵巻"
          width={1280}
          height={720}
          className="mb-6 h-auto w-full overflow-hidden rounded-lg"
          priority
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold text-sumi md:text-4xl">
              百人一首 100首
            </h1>
            <p className="mt-2 font-sans text-koshoku">情景を味わいながら、100首を覚える</p>
          </div>
          <Link
            href="/quiz/"
            className="rounded-full bg-shu px-6 py-2 font-sans text-washi transition hover:opacity-90"
          >
            クイズに挑戦 →
          </Link>
        </div>
      </header>
      <section aria-labelledby="poem-list-title">
        <h2 id="poem-list-title" className="sr-only">
          百人一首 一覧
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {poems.map((poem) => (
            <li key={poem.id}>
              <Link
                href={`/poems/${poem.slug}/`}
                className="block rounded border border-koshoku/30 bg-washi px-3 py-3 transition hover:border-shu focus-visible:border-shu"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-sans text-xs text-koshoku">第{poem.id}番</span>
                  <KimariBadge group={poem.kimariGroup} kimariJi={poem.kimariJi} />
                </div>
                <p className="font-klee text-base leading-relaxed text-sumi">{poem.kamiNoKu}</p>
                <p className="mt-1 font-sans text-xs text-koshoku">{poem.author}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
