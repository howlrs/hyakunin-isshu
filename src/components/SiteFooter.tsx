import Link from 'next/link';

const SITE_LAUNCH_YEAR = 2024;
const SITE_OWNER = '寺島和宏 (howlrs)';
const REPO_URL = 'https://github.com/howlrs/hyakunin-isshu';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const yearRange =
    currentYear > SITE_LAUNCH_YEAR
      ? `${SITE_LAUNCH_YEAR}–${currentYear}`
      : `${SITE_LAUNCH_YEAR}`;

  return (
    <footer className="mt-16 border-t border-koshoku/30 bg-washi/80">
      <div className="container mx-auto max-w-5xl px-4 py-6 text-center font-sans text-sm text-koshoku">
        <nav
          aria-label="サイト情報"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
        >
          <Link href="/about/" className="hover:text-shu hover:underline">
            このサイトについて
          </Link>
          <span aria-hidden="true" className="opacity-50">
            ·
          </span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-shu hover:underline"
          >
            GitHub
          </a>
        </nav>
        <small className="mt-3 block text-xs opacity-70">
          © {yearRange} {SITE_OWNER}. All rights reserved.
        </small>
      </div>
    </footer>
  );
}
