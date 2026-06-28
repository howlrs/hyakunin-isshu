import type { Metadata } from 'next';
import { VoiceProvider } from '@/components/VoiceProvider';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hyakunin.howlrs.net'),
  title: {
    default: '百人一首暗記',
    template: '%s | 百人一首暗記',
  },
  description: '百人一首100首を、情景を味わいながら覚えるWebアプリ。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: '百人一首暗記',
    images: [
      {
        url: '/images/hero.webp',
        width: 1280,
        height: 720,
        alt: '百人一首暗記 — 情景を味わいながら覚える',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <a href="#main-content" className="skip-link">
          本文へスキップ
        </a>
        <VoiceProvider>{children}</VoiceProvider>
        <SiteFooter />
      </body>
    </html>
  );
}
