import Link from 'next/link';
import { getAllPoems } from '@/lib/poems';
import { QuizSession } from '@/components/QuizSession';
import { JsonLd } from '@/components/JsonLd';

export const metadata = {
  title: 'クイズ — 一首稽古・苦手札・ランダム10問',
  description:
    '百人一首100首からランダムに10問。上の句から下の句、下の句から上の句を当てる4択クイズ。',
  alternates: { canonical: '/quiz/' },
};

export default function QuizPage() {
  const poems = getAllPoems();
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: '百人一首 ランダム10問クイズ',
    inLanguage: 'ja',
    educationalUse: 'memorization',
    learningResourceType: 'quiz',
  };
  return (
    <main id="main-content" className="container mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={ld} />
      <nav className="mb-6 font-sans text-sm">
        <Link href="/" className="text-koshoku hover:text-shu hover:underline">
          ← 一覧へ戻る
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-sumi md:text-4xl">クイズ</h1>
        <p className="mt-2 font-sans text-koshoku">
          一首稽古、苦手札の復習、ランダム10問に挑戦できます。正しい句を4択から選んでください。
        </p>
      </header>
      <QuizSession allPoems={poems} />
    </main>
  );
}
