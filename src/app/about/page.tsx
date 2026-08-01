import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';

export const metadata = {
  title: 'このサイトについて',
  description: '百人一首暗記アプリの目的・出典・著作権について。',
  alternates: { canonical: '/about/' },
};

export default function AboutPage() {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'このサイトについて',
    inLanguage: 'ja',
  };
  return (
    <main id="main-content" className="container mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={ld} />
      <h1 className="font-serif text-3xl font-bold text-sumi">このサイトについて</h1>

      <section className="my-8 space-y-3 leading-loose text-sumi">
        <h2 className="font-sans text-xl font-bold">目的</h2>
        <p>
          百人一首100首を「読み物として味わいながら覚える」ためのWebアプリです。
          句から句へ巡る回遊体験で、暗記と理解を同時に深めることを目指しました。
        </p>
      </section>

      <section className="my-8 space-y-3 leading-loose text-sumi">
        <h2 className="font-sans text-xl font-bold">苦手札の保存</h2>
        <p>
          「苦手札」に追加した歌の番号は、この端末のブラウザ内（localStorage）だけに保存されます。
          サーバーへの送信やアカウントとの同期は行いません。ブラウザのデータを削除すると苦手札も消去されます。
        </p>
      </section>

      <section className="my-8 space-y-3 leading-loose text-sumi">
        <h2 className="font-sans text-xl font-bold">出典・著作権</h2>
        <p>
          上の句・下の句の本文、作者、番号は <strong>パブリックドメイン</strong>{' '}
          の古典原典に依拠しています。
        </p>
        <p>
          各句に添えた「いつ・誰が」「情景」「意味」の解説は、本サイト運営者の独自表現で執筆しています。
          一部、学習用ノート (<code>docs/100.md</code>)
          を出典とし、それ以外は公知情報をもとに独自要約しています。
        </p>
      </section>

      <section className="my-8 space-y-3 leading-loose text-sumi">
        <h2 className="font-sans text-xl font-bold">技術</h2>
        <p>
          Next.js (App Router) + TypeScript + Tailwind CSS で実装し、Cloudflare Pages
          に静的書き出しでホスティングしています。
        </p>
      </section>

      <nav className="my-8">
        <Link href="/" className="font-sans text-shu hover:underline">
          ← 一覧へ戻る
        </Link>
      </nav>
    </main>
  );
}
