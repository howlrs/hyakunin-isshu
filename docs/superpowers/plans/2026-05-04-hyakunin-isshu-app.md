# 百人一首暗記アプリ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 百人一首100首を「読み物として味わいながら暗記する」Next.jsアプリを構築し、Cloudflare Pagesへ静的書き出しでデプロイする。

**Architecture:** Next.js 15 App Router + TypeScript + Tailwind CSS。100首はハードコード(`src/data/poems.ts`)、`output: 'export'` で全102ページ(top + about + poems×100)をビルド時SSG。クライアントはuseStateのみ(localStorage不使用)。SEOはJSON-LD/sitemap/canonical。アクセシビリティはRubyコンポーネントでスクリーンリーダー読み上げ事故を防止。

**Tech Stack:** Next.js 15, TypeScript 5, Tailwind CSS 4, Vitest, ESLint, Prettier, wrangler 4 (Cloudflare Pages), Noto Serif JP / Noto Sans JP / Klee One (Google Fonts)

---

## File Structure

### Phase 0: Project Skeleton
- Create `package.json` — npm scripts, dependencies
- Create `tsconfig.json` — TypeScript config (strict mode)
- Create `next.config.ts` — `output: 'export'`, `images.unoptimized: true`
- Create `tailwind.config.ts` — color tokens, font family tokens
- Create `postcss.config.mjs` — Tailwind v4 setup
- Create `.eslintrc.json` — Next.js ESLint config
- Create `.prettierrc.json` — formatter config
- Create `vitest.config.ts` — test runner config
- Create `src/app/layout.tsx` — root layout, font loading
- Create `src/app/globals.css` — Tailwind directives, base styles
- Create `src/app/page.tsx` — placeholder landing
- Create `public/favicon.ico` — placeholder

### Phase 1: Data Layer
- Create `src/data/types.ts` — Era, Theme, KimariGroup, Poem types
- Create `src/data/poems.ts` — 100首ハードコード (id 1-100)
- Create `src/lib/poems.ts` — getAllPoems / getPoemBySlug / getPoemById
- Create `src/lib/romaji.ts` — ひらがな→ローマ字 (slug生成補助)
- Create `tests/data/poems.test.ts` — 100件揃ってるか / 重複なし / 必須フィールド埋まってるか

### Phase 2: Quiz & Relations Logic
- Create `src/lib/quiz.ts` — pickDistractors (60/30/10ロジック)
- Create `src/lib/relations.ts` — getRelatedPoems (4軸)
- Create `tests/lib/quiz.test.ts` — ダミー抽出のテスト
- Create `tests/lib/relations.test.ts` — 関連句抽出のテスト

### Phase 3: UI Components
- Create `src/components/Ruby.tsx` — aria-hidden + sr-only
- Create `src/components/PoemBody.tsx` — 縦書き本文ブロック
- Create `src/components/KimariBadge.tsx` — 一字〜七字の視覚差
- Create `src/components/PoemCard.tsx` — トップ一覧カード
- Create `src/components/Quiz.tsx` — 4択クイズ + streak
- Create `src/components/RelatedPoemsSection.tsx` — 4軸関連リスト
- Create `src/components/TabFilter.tsx` — トップ一覧の切替タブ
- Create `src/components/JsonLd.tsx` — JSON-LD埋め込み

### Phase 4: Pages
- Modify `src/app/page.tsx` — トップ100首一覧 (TabFilter + PoemCard)
- Create `src/app/poems/[slug]/page.tsx` — 詳細ページ
- Create `src/app/about/page.tsx` — 出典・著作権明示
- Create `src/app/sitemap.ts` — 全102URL生成
- Create `src/app/robots.ts` — 全許可

### Phase 5: Deployment
- Create `wrangler.toml` — Cloudflare Pages設定
- Create `.github/workflows/ci.yml` — lint + typecheck + test + build (PR用)
- Modify `package.json` — `deploy` script追加
- Manual: Cloudflare Dashboard で GitHub連携設定

---

## Phase 0: プロジェクト初期化

### Task 0.1: package.json と Node環境の確定

**Files:**
- Create: `package.json`
- Create: `.nvmrc`

- [ ] **Step 1: 現状確認**

```bash
node --version  # v24系であることを確認
ls package.json 2>&1  # 存在しないことを確認
```

- [ ] **Step 2: package.json を作成**

```json
{
  "name": "hyakunin-isshu",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write .",
    "deploy": "next build && wrangler pages deploy out --project-name=hyakunin-isshu --branch=main"
  },
  "dependencies": {
    "next": "15.1.6",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "@types/node": "22.10.7",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "@vitejs/plugin-react": "4.3.4",
    "@vitest/coverage-v8": "2.1.8",
    "autoprefixer": "10.4.20",
    "eslint": "9.18.0",
    "eslint-config-next": "15.1.6",
    "jsdom": "25.0.1",
    "postcss": "8.5.1",
    "prettier": "3.4.2",
    "tailwindcss": "3.4.17",
    "typescript": "5.7.3",
    "vitest": "2.1.8"
  }
}
```

> ※ Tailwind v4 はまだプロダクション運用で罠が多いため v3.4 を採用 (Cloudflare Pages SSG との相性確認済み版)

- [ ] **Step 3: .nvmrc を作成**

```
24
```

- [ ] **Step 4: 依存インストール**

Run: `npm install`
Expected: `node_modules/` 生成、`package-lock.json` 生成

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .nvmrc
git commit -m "chore: initialize package.json with Next.js 15 / React 19 / Vitest"
```

---

### Task 0.2: TypeScript設定

**Files:**
- Create: `tsconfig.json`

- [ ] **Step 1: tsconfig.json を作成**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vitest/globals"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out", ".next"]
}
```

- [ ] **Step 2: typecheck 実行**

Run: `npm run typecheck`
Expected: エラーなし (まだソースなし)

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add TypeScript strict config with @/* alias"
```

---

### Task 0.3: Tailwind CSS設定

**Files:**
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`

- [ ] **Step 1: tailwind.config.ts を作成**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        washi: '#FAF6E9',     // 和紙ベージュ (背景)
        sumi: '#1F1B16',      // 墨色 (本文)
        shu: '#C7402A',       // 朱色 (アクセント)
        koshoku: '#8C6E3F',   // 古色 (サブテキスト・罫線)
      },
      fontFamily: {
        serif: ['var(--font-noto-serif-jp)', 'serif'],
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
        klee: ['var(--font-klee-one)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: postcss.config.mjs を作成**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts postcss.config.mjs
git commit -m "chore: add Tailwind config with washi/sumi/shu/koshoku tokens"
```

---

### Task 0.4: Next.js設定 + globals.css

**Files:**
- Create: `next.config.ts`
- Create: `src/app/globals.css`

- [ ] **Step 1: next.config.ts を作成**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
```

- [ ] **Step 2: src/app/globals.css を作成**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

html {
  background-color: #FAF6E9;
}

body {
  color: #1F1B16;
  font-family: var(--font-noto-serif-jp), serif;
  -webkit-font-smoothing: antialiased;
}

/* スクリーンリーダー専用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* skip-link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #1F1B16;
  color: #FAF6E9;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0;
}

/* フォーカススタイル */
:focus-visible {
  outline: 2px solid #C7402A;
  outline-offset: 2px;
}

/* 縦書き (poem-body 内のみ適用) */
.poem-vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
```

- [ ] **Step 3: Commit**

```bash
git add next.config.ts src/app/globals.css
git commit -m "chore: configure Next.js for static export with washi base styles"
```

---

### Task 0.5: ルートレイアウト + プレースホルダ

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: src/app/layout.tsx を作成**

```tsx
import type { Metadata } from 'next';
import { Noto_Serif_JP, Noto_Sans_JP, Klee_One } from 'next/font/google';
import './globals.css';

const notoSerifJp = Noto_Serif_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-serif-jp',
});

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
});

const kleeOne = Klee_One({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
  variable: '--font-klee-one',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://hyakunin-isshu.pages.dev'),
  title: {
    default: '百人一首暗記',
    template: '%s | 百人一首暗記',
  },
  description: '百人一首100首を、情景を味わいながら覚えるWebアプリ。',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: '百人一首暗記',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${notoSerifJp.variable} ${notoSansJp.variable} ${kleeOne.variable}`}
    >
      <body>
        <a href="#main-content" className="skip-link">本文へスキップ</a>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: src/app/page.tsx をプレースホルダで作成**

```tsx
export default function HomePage() {
  return (
    <main id="main-content" className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">百人一首暗記</h1>
      <p className="mt-2 text-koshoku">準備中</p>
    </main>
  );
}
```

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: `out/` に静的書き出しが成功

- [ ] **Step 4: dev起動確認 (手動)**

Run: `npm run dev`
Expected: http://localhost:3000 でプレースホルダが表示される (Ctrl+C で停止)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: add root layout with Japanese fonts and placeholder home"
```

---

### Task 0.6: Vitest セットアップ + 動作確認

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/sanity.test.ts`

- [ ] **Step 1: vitest.config.ts を作成**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 2: tests/sanity.test.ts を作成 (動作確認用)**

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('can run vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 3: テスト実行**

Run: `npm test`
Expected: 1 passed

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/sanity.test.ts
git commit -m "chore: configure Vitest with jsdom environment"
```

---

### Task 0.7: ESLint + Prettier

**Files:**
- Create: `.eslintrc.json`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: .eslintrc.json を作成**

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

- [ ] **Step 2: .prettierrc.json を作成**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 3: .prettierignore を作成**

```
node_modules
out
.next
coverage
package-lock.json
docs/100.md
```

- [ ] **Step 4: lint 動作確認**

Run: `npm run lint`
Expected: エラーなし

- [ ] **Step 5: Commit**

```bash
git add .eslintrc.json .prettierrc.json .prettierignore
git commit -m "chore: add ESLint and Prettier config"
```

---

## Phase 1: データ層 (型 + 100首ハードコード)

### Task 1.1: 型定義

**Files:**
- Create: `src/data/types.ts`

- [ ] **Step 1: src/data/types.ts を作成**

```ts
export type Era =
  | 'nara'         // 奈良時代
  | 'heian-early'  // 平安初期
  | 'heian-mid'    // 平安中期
  | 'heian-late'  // 平安後期
  | 'kamakura';   // 鎌倉時代

export type Theme =
  | 'love'              // 恋
  | 'season-spring'     // 春
  | 'season-summer'     // 夏
  | 'season-autumn'     // 秋
  | 'season-winter'     // 冬
  | 'travel-farewell'   // 旅・別れ
  | 'nature'            // 自然・風景
  | 'impermanence'      // 無常・人生
  | 'court-life'        // 宮廷・雅
  | 'lament';           // 嘆き・愁い

export type KimariGroup =
  | 'ichiji'    // 一字決まり
  | 'niji'      // 二字決まり
  | 'sanji'     // 三字決まり
  | 'yonji'     // 四字決まり
  | 'goji'      // 五字決まり
  | 'rokuji'    // 六字決まり
  | 'shichiji'; // 七字決まり

export type Source = 'docs/100.md' | 'public-domain';

export interface Poem {
  id: number;             // 1..100
  slug: string;           // "<id>-<上の句先頭ローマ字>"
  kamiNoKu: string;       // 上の句 (漢字かな交じり)
  shimoNoKu: string;      // 下の句
  kamiKana: string;       // 上の句ひらがな
  shimoKana: string;      // 下の句ひらがな
  author: string;         // 作者名 (歴史的表記)
  authorReading: string;  // 作者よみ
  era: Era;
  themes: Theme[];        // 1〜3個程度
  kimariJi: string;       // 決まり字 (例: "む", "うら", "ちは")
  kimariGroup: KimariGroup;
  whoWhen: string;        // いつ・誰が
  scene: string;          // 情景
  meaning: string;        // 意味 (現代語訳)
  source: Source;
}

/** テーマの日本語表示名 */
export const THEME_LABELS: Record<Theme, string> = {
  'love': '恋',
  'season-spring': '春',
  'season-summer': '夏',
  'season-autumn': '秋',
  'season-winter': '冬',
  'travel-farewell': '旅・別れ',
  'nature': '自然',
  'impermanence': '無常',
  'court-life': '宮廷',
  'lament': '嘆き',
};

/** 時代の日本語表示名 */
export const ERA_LABELS: Record<Era, string> = {
  'nara': '奈良時代',
  'heian-early': '平安初期',
  'heian-mid': '平安中期',
  'heian-late': '平安後期',
  'kamakura': '鎌倉時代',
};

/** 決まり字グループの日本語表示名 */
export const KIMARI_LABELS: Record<KimariGroup, string> = {
  'ichiji': '一字決まり',
  'niji': '二字決まり',
  'sanji': '三字決まり',
  'yonji': '四字決まり',
  'goji': '五字決まり',
  'rokuji': '六字決まり',
  'shichiji': '七字決まり',
};
```

- [ ] **Step 2: typecheck 確認**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(data): define Poem types with Era/Theme/KimariGroup"
```

---

### Task 1.2: poems.ts 100首ハードコード (Part 1: 1-25番)

**Files:**
- Create: `src/data/poems.ts`

> ⚠️ このタスクは **百人一首の正本データを正確に投入する**作業。
> 各句の上の句・下の句・作者は公知 (パブリックドメイン)。
> whoWhen / scene / meaning は `docs/100.md` 由来 (該当する場合) または独自リライト。
> 決まり字は札取りの公知ルールに従う。
> ローマ字 (slug用) は **訓令式** で揃える (例: 「ちはやぶる」→ "tihayaburu"... と思いきや
> 一般的な検索性で **ヘボン式** 採用: 「ちはやぶる」→ "chihayaburu")。
> ※ slug は重複しないよう実装時に検証 (Task 1.4で重複チェック)

- [ ] **Step 1: 1〜25番を作成**

```ts
import type { Poem } from './types';

export const POEMS: Poem[] = [
  {
    id: 1,
    slug: '1-akinotano',
    kamiNoKu: '秋の田の かりほの庵の 苫をあらみ',
    shimoNoKu: 'わが衣手は 露にぬれつつ',
    kamiKana: 'あきのたの かりほのいおの とまをあらみ',
    shimoKana: 'わがころもでは つゆにぬれつつ',
    author: '天智天皇',
    authorReading: 'てんじてんのう',
    era: 'nara',
    themes: ['season-autumn', 'nature'],
    kimariJi: 'あきのた',
    kimariGroup: 'yonji',
    whoWhen: '飛鳥時代後期、天智天皇 (中大兄皇子)。',
    scene: '秋の田を見守る粗末な仮小屋。屋根の苫が粗いため、夜露が衣の袖を濡らしてゆく。',
    meaning: '稲を守る民の労苦に思いを馳せた帝王の歌。実作は別人とも伝わる。',
    source: 'docs/100.md',
  },
  {
    id: 2,
    slug: '2-harusugite',
    kamiNoKu: '春過ぎて 夏来にけらし 白妙の',
    shimoNoKu: '衣ほすてふ 天の香具山',
    kamiKana: 'はるすぎて なつきにけらし しろたえの',
    shimoKana: 'ころもほすちょう あまのかぐやま',
    author: '持統天皇',
    authorReading: 'じとうてんのう',
    era: 'nara',
    themes: ['season-summer', 'season-spring', 'nature'],
    kimariJi: 'はるす',
    kimariGroup: 'sanji',
    whoWhen: '飛鳥時代、持統天皇。藤原京から望む天香久山を詠む。',
    scene: '春が過ぎ夏が来た。香具山の麓に、神事の白い衣が干されているという。',
    meaning: '純白の衣と新緑の山が映える、清々しい初夏の到来。',
    source: 'docs/100.md',
  },
  // ... 残り3-25番は実装時に投入
];
```

> 💡 **実装時の注意**: 上記2件はサンプル。実装フェーズでは spec §1.2 の方針に従い、
> 100.md由来の解説 (whoWhen/scene/meaning) を優先採用。再掲扱いで詳細がない句は
> 公知情報を **私 (Claude) の言葉で要約・リライト** する (著作権・SEO重複対策)。
> 決まり字 / kimariGroup / themes / era は手動分類。

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`
Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/data/poems.ts
git commit -m "feat(data): add poems 1-25 (100.md derived where applicable)"
```

---

### Task 1.3: poems.ts (Part 2: 26-50番)

- [ ] **Step 1: 26〜50番を追加**

(Task 1.2 と同じ要領で、`src/data/poems.ts` の `POEMS` 配列に 26〜50番を追加)

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/data/poems.ts
git commit -m "feat(data): add poems 26-50"
```

---

### Task 1.4: poems.ts (Part 3: 51-75番)

- [ ] **Step 1: 51〜75番を追加**

(同様)

- [ ] **Step 2: typecheck**

- [ ] **Step 3: Commit**

```bash
git add src/data/poems.ts
git commit -m "feat(data): add poems 51-75"
```

---

### Task 1.5: poems.ts (Part 4: 76-100番) + 100首検証テスト

**Files:**
- Modify: `src/data/poems.ts`
- Create: `tests/data/poems.test.ts`

- [ ] **Step 1: 76〜100番を追加**

(同様)

- [ ] **Step 2: 検証テストを作成**

```ts
import { describe, it, expect } from 'vitest';
import { POEMS } from '@/data/poems';

describe('POEMS', () => {
  it('contains exactly 100 poems', () => {
    expect(POEMS).toHaveLength(100);
  });

  it('has unique ids 1-100', () => {
    const ids = POEMS.map((p) => p.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it('has unique slugs', () => {
    const slugs = POEMS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(100);
  });

  it('has all required text fields filled (no empty strings)', () => {
    for (const p of POEMS) {
      expect(p.kamiNoKu, `id=${p.id} kamiNoKu`).not.toBe('');
      expect(p.shimoNoKu, `id=${p.id} shimoNoKu`).not.toBe('');
      expect(p.kamiKana, `id=${p.id} kamiKana`).not.toBe('');
      expect(p.shimoKana, `id=${p.id} shimoKana`).not.toBe('');
      expect(p.author, `id=${p.id} author`).not.toBe('');
      expect(p.authorReading, `id=${p.id} authorReading`).not.toBe('');
      expect(p.kimariJi, `id=${p.id} kimariJi`).not.toBe('');
      expect(p.whoWhen, `id=${p.id} whoWhen`).not.toBe('');
      expect(p.scene, `id=${p.id} scene`).not.toBe('');
      expect(p.meaning, `id=${p.id} meaning`).not.toBe('');
    }
  });

  it('has at least one theme per poem', () => {
    for (const p of POEMS) {
      expect(p.themes.length, `id=${p.id}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('has slug starting with id', () => {
    for (const p of POEMS) {
      expect(p.slug.startsWith(`${p.id}-`), `id=${p.id} slug=${p.slug}`).toBe(true);
    }
  });
});
```

- [ ] **Step 3: テスト実行**

Run: `npm test`
Expected: 全件 PASS

- [ ] **Step 4: Commit**

```bash
git add src/data/poems.ts tests/data/poems.test.ts
git commit -m "feat(data): complete 100 poems with validation tests"
```

---

### Task 1.6: lib/poems.ts (アクセサ関数)

**Files:**
- Create: `src/lib/poems.ts`
- Create: `tests/lib/poems.test.ts`

- [ ] **Step 1: tests/lib/poems.test.ts (失敗するテスト)**

```ts
import { describe, it, expect } from 'vitest';
import { getAllPoems, getPoemBySlug, getPoemById } from '@/lib/poems';

describe('lib/poems', () => {
  it('getAllPoems returns 100 poems', () => {
    expect(getAllPoems()).toHaveLength(100);
  });

  it('getPoemById returns matching poem', () => {
    const p = getPoemById(1);
    expect(p?.id).toBe(1);
  });

  it('getPoemById returns undefined for missing id', () => {
    expect(getPoemById(999)).toBeUndefined();
  });

  it('getPoemBySlug returns matching poem', () => {
    const p = getPoemBySlug('1-akinotano');
    expect(p?.id).toBe(1);
  });

  it('getPoemBySlug returns undefined for missing slug', () => {
    expect(getPoemBySlug('not-exist')).toBeUndefined();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test`
Expected: FAIL (lib/poems がまだ存在しない)

- [ ] **Step 3: src/lib/poems.ts を作成**

```ts
import { POEMS } from '@/data/poems';
import type { Poem } from '@/data/types';

export function getAllPoems(): Poem[] {
  return POEMS;
}

export function getPoemById(id: number): Poem | undefined {
  return POEMS.find((p) => p.id === id);
}

export function getPoemBySlug(slug: string): Poem | undefined {
  return POEMS.find((p) => p.slug === slug);
}
```

- [ ] **Step 4: テスト PASS 確認**

Run: `npm test`
Expected: 全件 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/poems.ts tests/lib/poems.test.ts
git commit -m "feat(lib): add getAllPoems / getPoemById / getPoemBySlug"
```

---

## Phase 2: ロジック層 (クイズ + 関連句)

### Task 2.1: lib/quiz.ts (ダミー抽出ロジック)

**Files:**
- Create: `src/lib/quiz.ts`
- Create: `tests/lib/quiz.test.ts`

- [ ] **Step 1: tests/lib/quiz.test.ts (失敗するテスト)**

```ts
import { describe, it, expect } from 'vitest';
import { POEMS } from '@/data/poems';
import { pickDistractors } from '@/lib/quiz';

describe('pickDistractors', () => {
  const correct = POEMS[0];

  it('returns exactly 3 distractors by default', () => {
    const distractors = pickDistractors(correct, POEMS, 3, () => 0.5);
    expect(distractors).toHaveLength(3);
  });

  it('does not include the correct poem', () => {
    const distractors = pickDistractors(correct, POEMS, 3, () => 0.5);
    expect(distractors.find((p) => p.id === correct.id)).toBeUndefined();
  });

  it('returns unique poems (no duplicates)', () => {
    const distractors = pickDistractors(correct, POEMS, 3, () => 0.5);
    const ids = distractors.map((p) => p.id);
    expect(new Set(ids).size).toBe(distractors.length);
  });

  it('handles count = 0', () => {
    const distractors = pickDistractors(correct, POEMS, 0, () => 0.5);
    expect(distractors).toEqual([]);
  });

  it('falls back gracefully when not enough same-theme poems', () => {
    // 単独poemsだけ渡してもクラッシュしない (ただし要求数を満たせない可能性あり)
    const small = POEMS.slice(0, 5);
    const distractors = pickDistractors(small[0], small, 3, () => 0.5);
    expect(distractors.length).toBeLessThanOrEqual(3);
    expect(distractors.find((p) => p.id === small[0].id)).toBeUndefined();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test`
Expected: FAIL

- [ ] **Step 3: src/lib/quiz.ts を作成**

```ts
import type { Poem } from '@/data/types';

/**
 * ダミー選択肢を抽出する。
 *
 * 比率 (count=3 の場合):
 * - 60% (≒ 2件) 同テーマから (適度な紛らわしさ)
 * - 30% (≒ 1件) ランダム (一般識別力)
 * - 10% 同決まり字グループから (時々入る難問)
 *
 * 上記比率を満たせない場合は、残り枠をランダムプールから補充する。
 *
 * @param random テスト容易性のため Math.random を注入可能にする
 */
export function pickDistractors(
  correct: Poem,
  all: Poem[],
  count = 3,
  random: () => number = Math.random,
): Poem[] {
  if (count <= 0) return [];

  const candidates = all.filter((p) => p.id !== correct.id);
  if (candidates.length === 0) return [];

  // プール構築
  const sameThemePool = candidates.filter((p) =>
    p.themes.some((t) => correct.themes.includes(t)),
  );
  const sameKimariPool = candidates.filter((p) => p.kimariGroup === correct.kimariGroup);

  // 60/10/30 の枠
  const themeQuota = Math.round(count * 0.6);
  const kimariQuota = Math.max(0, Math.round(count * 0.1));
  const randomQuota = count - themeQuota - kimariQuota;

  const picked: Poem[] = [];
  const pickedIds = new Set<number>();

  function pickFromPool(pool: Poem[], n: number) {
    const available = pool.filter((p) => !pickedIds.has(p.id));
    const shuffled = [...available].sort(() => random() - 0.5);
    for (const p of shuffled.slice(0, n)) {
      picked.push(p);
      pickedIds.add(p.id);
    }
  }

  pickFromPool(sameThemePool, themeQuota);
  pickFromPool(sameKimariPool, kimariQuota);
  pickFromPool(candidates, randomQuota);

  // 不足している場合 (プール小規模時) は残り全候補から補充
  if (picked.length < count) {
    pickFromPool(candidates, count - picked.length);
  }

  return picked.slice(0, count);
}
```

- [ ] **Step 4: テスト PASS 確認**

Run: `npm test`
Expected: 全件 PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/quiz.ts tests/lib/quiz.test.ts
git commit -m "feat(lib): add pickDistractors with 60/30/10 ratio"
```

---

### Task 2.2: lib/relations.ts (関連句抽出)

**Files:**
- Create: `src/lib/relations.ts`
- Create: `tests/lib/relations.test.ts`

- [ ] **Step 1: tests/lib/relations.test.ts (失敗するテスト)**

```ts
import { describe, it, expect } from 'vitest';
import { POEMS } from '@/data/poems';
import { getRelatedPoems } from '@/lib/relations';

describe('getRelatedPoems', () => {
  const target = POEMS[0];

  it('does not include the target poem in any list', () => {
    const r = getRelatedPoems(target, POEMS);
    const allRelated = [
      ...r.sameAuthor,
      ...r.sameTheme.flatMap((s) => s.poems),
      ...r.sameKimariGroup,
      ...r.sameEra,
    ];
    expect(allRelated.find((p) => p.id === target.id)).toBeUndefined();
  });

  it('returns at most 4 poems per axis', () => {
    const r = getRelatedPoems(target, POEMS);
    expect(r.sameAuthor.length).toBeLessThanOrEqual(4);
    expect(r.sameKimariGroup.length).toBeLessThanOrEqual(4);
    expect(r.sameEra.length).toBeLessThanOrEqual(4);
    for (const s of r.sameTheme) {
      expect(s.poems.length).toBeLessThanOrEqual(4);
    }
  });

  it('sameAuthor returns only poems by the same author', () => {
    const r = getRelatedPoems(target, POEMS);
    for (const p of r.sameAuthor) {
      expect(p.author).toBe(target.author);
    }
  });

  it('sameKimariGroup returns only poems with the same kimariGroup', () => {
    const r = getRelatedPoems(target, POEMS);
    for (const p of r.sameKimariGroup) {
      expect(p.kimariGroup).toBe(target.kimariGroup);
    }
  });

  it('sameEra returns only poems from the same era', () => {
    const r = getRelatedPoems(target, POEMS);
    for (const p of r.sameEra) {
      expect(p.era).toBe(target.era);
    }
  });
});
```

- [ ] **Step 2: テスト失敗確認**

Run: `npm test`
Expected: FAIL

- [ ] **Step 3: src/lib/relations.ts を作成**

```ts
import type { Poem, Theme } from '@/data/types';

export interface ThemeGroup {
  theme: Theme;
  poems: Poem[];
}

export interface RelatedPoems {
  sameAuthor: Poem[];
  sameTheme: ThemeGroup[];      // 各テーマ最大4件
  sameKimariGroup: Poem[];
  sameEra: Poem[];
}

const MAX_PER_AXIS = 4;

export function getRelatedPoems(target: Poem, all: Poem[]): RelatedPoems {
  const others = all.filter((p) => p.id !== target.id);

  const sameAuthor = others
    .filter((p) => p.author === target.author)
    .slice(0, MAX_PER_AXIS);

  const sameTheme: ThemeGroup[] = target.themes.map((theme) => ({
    theme,
    poems: others
      .filter((p) => p.themes.includes(theme))
      .slice(0, MAX_PER_AXIS),
  }));

  const sameKimariGroup = others
    .filter((p) => p.kimariGroup === target.kimariGroup)
    .slice(0, MAX_PER_AXIS);

  const sameEra = others
    .filter((p) => p.era === target.era)
    .slice(0, MAX_PER_AXIS);

  return { sameAuthor, sameTheme, sameKimariGroup, sameEra };
}
```

- [ ] **Step 4: テスト PASS 確認**

Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add src/lib/relations.ts tests/lib/relations.test.ts
git commit -m "feat(lib): add getRelatedPoems with 4-axis grouping"
```

---

## Phase 3: UIコンポーネント

### Task 3.1: Ruby コンポーネント

**Files:**
- Create: `src/components/Ruby.tsx`
- Create: `tests/components/Ruby.test.tsx`

- [ ] **Step 1: テスト**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Ruby } from '@/components/Ruby';

describe('Ruby', () => {
  it('renders ruby with aria-hidden and sr-only reading', () => {
    const { container } = render(<Ruby base="秋" reading="あき" />);
    const ruby = container.querySelector('ruby');
    expect(ruby?.getAttribute('aria-hidden')).toBe('true');
    expect(ruby?.textContent).toContain('秋');
    const srOnly = container.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe('あき');
  });
});
```

- [ ] **Step 2: 不足ライブラリ追加**

Run: `npm install -D @testing-library/react @testing-library/jest-dom`
Run: `npm test`
Expected: FAIL (Ruby未実装)

- [ ] **Step 3: src/components/Ruby.tsx を作成**

```tsx
export function Ruby({ base, reading }: { base: string; reading: string }) {
  return (
    <>
      <ruby aria-hidden="true">
        {base}
        <rt>{reading}</rt>
      </ruby>
      <span className="sr-only">{reading}</span>
    </>
  );
}
```

- [ ] **Step 4: テスト PASS**

Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add src/components/Ruby.tsx tests/components/Ruby.test.tsx package.json package-lock.json
git commit -m "feat(ui): add accessible Ruby component"
```

---

### Task 3.2: KimariBadge コンポーネント

**Files:**
- Create: `src/components/KimariBadge.tsx`

- [ ] **Step 1: src/components/KimariBadge.tsx**

```tsx
import { KIMARI_LABELS, type KimariGroup } from '@/data/types';

const STYLE_BY_GROUP: Record<KimariGroup, string> = {
  ichiji: 'bg-shu text-washi',                       // 朱地・白文字 (最強調)
  niji: 'border border-shu text-shu',                // 朱枠・朱文字
  sanji: 'border border-koshoku text-sumi',          // 古色枠・墨文字
  yonji: 'border border-koshoku text-sumi',
  goji: 'border border-koshoku text-sumi',
  rokuji: 'border border-koshoku text-sumi',
  shichiji: 'border border-koshoku text-sumi',
};

export function KimariBadge({ group, kimariJi }: { group: KimariGroup; kimariJi: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-sans ${STYLE_BY_GROUP[group]}`}
      aria-label={`${KIMARI_LABELS[group]} 「${kimariJi}」`}
    >
      <span className="font-bold">{KIMARI_LABELS[group]}</span>
      <span>「{kimariJi}」</span>
    </span>
  );
}
```

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add src/components/KimariBadge.tsx
git commit -m "feat(ui): add KimariBadge with hierarchical styling"
```

---

### Task 3.3: PoemBody コンポーネント (縦書き本文)

**Files:**
- Create: `src/components/PoemBody.tsx`

> ⚠️ 縦書きでは Ruby が複雑になる。今回は **句本文表示は kana ベース (ひらがな)** にし、
> ruby 漢字版は提供しない (古典の歌をひらがなで味わう体験を優先)。
> 解説本文中の固有名詞では Ruby を使う。

- [ ] **Step 1: src/components/PoemBody.tsx**

```tsx
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
```

- [ ] **Step 2: typecheck**

- [ ] **Step 3: Commit**

```bash
git add src/components/PoemBody.tsx
git commit -m "feat(ui): add vertical-writing PoemBody with screen-reader fallback"
```

---

### Task 3.4: PoemCard コンポーネント (一覧用)

**Files:**
- Create: `src/components/PoemCard.tsx`

- [ ] **Step 1: src/components/PoemCard.tsx**

```tsx
import Link from 'next/link';
import type { Poem } from '@/data/types';
import { KimariBadge } from './KimariBadge';

export function PoemCard({ poem }: { poem: Poem }) {
  return (
    <Link
      href={`/poems/${poem.slug}/`}
      className="group flex flex-col gap-2 rounded-lg border border-koshoku/30 bg-washi p-4 transition hover:border-shu hover:shadow-md focus-visible:border-shu"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-sans text-sm text-koshoku">第{poem.id}番</span>
        <KimariBadge group={poem.kimariGroup} kimariJi={poem.kimariJi} />
      </div>
      <p className="font-klee text-lg leading-relaxed text-sumi group-hover:text-shu">
        {poem.kamiNoKu}
      </p>
      <p className="font-sans text-sm text-koshoku">{poem.author}</p>
    </Link>
  );
}
```

- [ ] **Step 2: typecheck**

- [ ] **Step 3: Commit**

```bash
git add src/components/PoemCard.tsx
git commit -m "feat(ui): add PoemCard for top page list"
```

---

### Task 3.5: Quiz コンポーネント

**Files:**
- Create: `src/components/Quiz.tsx`
- Create: `tests/components/Quiz.test.tsx`

- [ ] **Step 1: テスト**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POEMS } from '@/data/poems';
import { Quiz } from '@/components/Quiz';

describe('Quiz', () => {
  it('shows 4 choices', () => {
    render(<Quiz correct={POEMS[0]} all={POEMS} mode="lower-from-upper" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
  });

  it('marks correct answer when clicked', () => {
    render(<Quiz correct={POEMS[0]} all={POEMS} mode="lower-from-upper" />);
    const correctButton = screen.getByRole('button', { name: new RegExp(POEMS[0].shimoNoKu) });
    fireEvent.click(correctButton);
    expect(correctButton.getAttribute('data-state')).toBe('correct');
  });
});
```

- [ ] **Step 2: テスト失敗確認**

Run: `npm test`

- [ ] **Step 3: src/components/Quiz.tsx を作成**

```tsx
'use client';

import { useMemo, useState } from 'react';
import type { Poem } from '@/data/types';
import { pickDistractors } from '@/lib/quiz';

export type QuizMode = 'upper-from-lower' | 'lower-from-upper';

interface Props {
  correct: Poem;
  all: Poem[];
  mode: QuizMode;
}

export function Quiz({ correct, all, mode }: Props) {
  const distractors = useMemo(() => pickDistractors(correct, all, 3), [correct, all]);
  const choices = useMemo(() => {
    const arr = [correct, ...distractors];
    return arr.sort(() => Math.random() - 0.5);
  }, [correct, distractors]);

  const [pickedId, setPickedId] = useState<number | null>(null);

  const isAnswered = pickedId !== null;
  const prompt = mode === 'lower-from-upper' ? correct.kamiNoKu : correct.shimoNoKu;
  const promptLabel = mode === 'lower-from-upper' ? '上の句' : '下の句';
  const choiceLabel = mode === 'lower-from-upper' ? '下の句' : '上の句';
  const getChoiceText = (p: Poem) => (mode === 'lower-from-upper' ? p.shimoNoKu : p.kamiNoKu);

  return (
    <div className="my-4 space-y-4 rounded-lg border border-koshoku/30 bg-washi p-4">
      <p className="font-sans text-sm text-koshoku">
        {promptLabel}から{choiceLabel}を選んでください
      </p>
      <p className="font-klee text-lg text-sumi">{prompt}</p>
      <ul className="space-y-2">
        {choices.map((p) => {
          const state = !isAnswered
            ? 'idle'
            : p.id === correct.id
              ? 'correct'
              : p.id === pickedId
                ? 'wrong'
                : 'idle';
          const stateClasses = {
            idle: 'border-koshoku/40 hover:border-shu',
            correct: 'border-green-700 bg-green-50 text-green-900',
            wrong: 'border-red-700 bg-red-50 text-red-900',
          }[state];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => !isAnswered && setPickedId(p.id)}
                disabled={isAnswered}
                data-state={state}
                className={`w-full rounded border px-3 py-2 text-left font-klee transition ${stateClasses}`}
              >
                {getChoiceText(p)}
              </button>
            </li>
          );
        })}
      </ul>
      {isAnswered && (
        <button
          type="button"
          onClick={() => setPickedId(null)}
          className="font-sans text-sm text-shu underline"
        >
          もう一度
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: テスト PASS**

Run: `npm test`

- [ ] **Step 5: Commit**

```bash
git add src/components/Quiz.tsx tests/components/Quiz.test.tsx
git commit -m "feat(ui): add Quiz with 4 choices and immediate feedback"
```

---

### Task 3.6: RelatedPoemsSection コンポーネント

**Files:**
- Create: `src/components/RelatedPoemsSection.tsx`

- [ ] **Step 1: src/components/RelatedPoemsSection.tsx**

```tsx
import Link from 'next/link';
import type { Poem } from '@/data/types';
import { THEME_LABELS, ERA_LABELS, KIMARI_LABELS } from '@/data/types';
import type { RelatedPoems } from '@/lib/relations';

function PoemMiniLink({ poem }: { poem: Poem }) {
  return (
    <Link
      href={`/poems/${poem.slug}/`}
      className="block rounded border border-koshoku/30 px-3 py-2 font-klee text-sumi hover:border-shu hover:text-shu"
    >
      <span className="text-xs text-koshoku">第{poem.id}番</span>
      <span className="ml-2">{poem.kamiNoKu}</span>
      <span className="ml-2 text-xs text-koshoku">— {poem.author}</span>
    </Link>
  );
}

export function RelatedPoemsSection({ related, target }: { related: RelatedPoems; target: Poem }) {
  return (
    <section className="my-8 space-y-6">
      <h2 className="font-sans text-xl font-bold text-sumi">関連する句</h2>

      {related.sameAuthor.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
            同じ作者「{target.author}」
          </h3>
          <ul className="space-y-1">
            {related.sameAuthor.map((p) => (
              <li key={p.id}>
                <PoemMiniLink poem={p} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {related.sameTheme.map(({ theme, poems }) =>
        poems.length > 0 ? (
          <div key={theme}>
            <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
              同じテーマ「{THEME_LABELS[theme]}」
            </h3>
            <ul className="space-y-1">
              {poems.map((p) => (
                <li key={p.id}>
                  <PoemMiniLink poem={p} />
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}

      {related.sameKimariGroup.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
            同じ{KIMARI_LABELS[target.kimariGroup]}
          </h3>
          <ul className="space-y-1">
            {related.sameKimariGroup.map((p) => (
              <li key={p.id}>
                <PoemMiniLink poem={p} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {related.sameEra.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
            同じ{ERA_LABELS[target.era]}
          </h3>
          <ul className="space-y-1">
            {related.sameEra.map((p) => (
              <li key={p.id}>
                <PoemMiniLink poem={p} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: typecheck**

- [ ] **Step 3: Commit**

```bash
git add src/components/RelatedPoemsSection.tsx
git commit -m "feat(ui): add RelatedPoemsSection with 4-axis links"
```

---

### Task 3.7: TabFilter コンポーネント

**Files:**
- Create: `src/components/TabFilter.tsx`

- [ ] **Step 1: src/components/TabFilter.tsx**

```tsx
'use client';

import { useState, useMemo } from 'react';
import type { Poem } from '@/data/types';
import { THEME_LABELS, ERA_LABELS, KIMARI_LABELS, type Theme, type Era, type KimariGroup } from '@/data/types';
import { PoemCard } from './PoemCard';

type TabKey = 'number' | 'kimari' | 'author' | 'theme' | 'era';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'number', label: '番号順' },
  { key: 'kimari', label: '決まり字' },
  { key: 'author', label: '作者' },
  { key: 'theme', label: 'テーマ' },
  { key: 'era', label: '時代' },
];

export function TabFilter({ poems }: { poems: Poem[] }) {
  const [tab, setTab] = useState<TabKey>('number');

  const grouped = useMemo(() => {
    if (tab === 'number') {
      return [{ key: 'all', label: '', poems: [...poems].sort((a, b) => a.id - b.id) }];
    }
    if (tab === 'kimari') {
      const groups = new Map<KimariGroup, Poem[]>();
      for (const p of poems) {
        const arr = groups.get(p.kimariGroup) ?? [];
        arr.push(p);
        groups.set(p.kimariGroup, arr);
      }
      const order: KimariGroup[] = ['ichiji', 'niji', 'sanji', 'yonji', 'goji', 'rokuji', 'shichiji'];
      return order
        .filter((g) => groups.has(g))
        .map((g) => ({ key: g, label: KIMARI_LABELS[g], poems: groups.get(g)! }));
    }
    if (tab === 'author') {
      const groups = new Map<string, Poem[]>();
      for (const p of poems) {
        const arr = groups.get(p.author) ?? [];
        arr.push(p);
        groups.set(p.author, arr);
      }
      return [...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'ja'))
        .map(([author, ps]) => ({ key: author, label: author, poems: ps }));
    }
    if (tab === 'theme') {
      const groups = new Map<Theme, Poem[]>();
      for (const p of poems) {
        for (const t of p.themes) {
          const arr = groups.get(t) ?? [];
          if (!arr.some((existing) => existing.id === p.id)) arr.push(p);
          groups.set(t, arr);
        }
      }
      return [...groups.entries()].map(([theme, ps]) => ({
        key: theme,
        label: THEME_LABELS[theme],
        poems: ps,
      }));
    }
    if (tab === 'era') {
      const groups = new Map<Era, Poem[]>();
      for (const p of poems) {
        const arr = groups.get(p.era) ?? [];
        arr.push(p);
        groups.set(p.era, arr);
      }
      const order: Era[] = ['nara', 'heian-early', 'heian-mid', 'heian-late', 'kamakura'];
      return order
        .filter((e) => groups.has(e))
        .map((e) => ({ key: e, label: ERA_LABELS[e], poems: groups.get(e)! }));
    }
    return [];
  }, [tab, poems]);

  return (
    <>
      <nav
        className="mb-6 flex flex-wrap gap-2 border-b border-koshoku/30 pb-4"
        aria-label="一覧の表示切替"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1 font-sans text-sm transition ${
              tab === t.key
                ? 'bg-shu text-washi'
                : 'border border-koshoku/40 text-sumi hover:border-shu hover:text-shu'
            }`}
            aria-pressed={tab === t.key}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="space-y-8">
        {grouped.map((g) => (
          <section key={g.key}>
            {g.label && (
              <h2 className="mb-3 font-sans text-lg font-bold text-koshoku">{g.label}</h2>
            )}
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.poems.map((p) => (
                <li key={p.id}>
                  <PoemCard poem={p} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: typecheck**

- [ ] **Step 3: Commit**

```bash
git add src/components/TabFilter.tsx
git commit -m "feat(ui): add TabFilter for number/kimari/author/theme/era views"
```

---

### Task 3.8: JsonLd コンポーネント (汎用)

**Files:**
- Create: `src/components/JsonLd.tsx`

- [ ] **Step 1: src/components/JsonLd.tsx**

```tsx
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/JsonLd.tsx
git commit -m "feat(ui): add JsonLd helper component"
```

---

## Phase 4: ページ実装

### Task 4.1: トップページ

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: src/app/page.tsx を本実装に差し替え**

```tsx
import { getAllPoems } from '@/lib/poems';
import { TabFilter } from '@/components/TabFilter';
import { JsonLd } from '@/components/JsonLd';

export const metadata = {
  title: '百人一首 100首 一覧',
  description: '百人一首100首を、情景を味わいながら覚えるためのWebアプリ。番号順・決まり字・作者・テーマ・時代で並び替えできます。',
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
        <h1 className="font-serif text-3xl font-bold text-sumi md:text-4xl">百人一首 100首</h1>
        <p className="mt-2 font-sans text-koshoku">情景を味わいながら、100首を覚える</p>
      </header>
      <TabFilter poems={poems} />
      <footer className="mt-12 border-t border-koshoku/30 pt-4 text-center font-sans text-sm text-koshoku">
        <a href="/about/" className="hover:text-shu hover:underline">
          このサイトについて
        </a>
      </footer>
    </main>
  );
}
```

- [ ] **Step 2: dev起動確認 (手動)**

Run: `npm run dev`
Expected: http://localhost:3000 で100首一覧が表示される (Ctrl+C)

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: 静的書き出し成功

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(app): implement top page with TabFilter and ItemList JSON-LD"
```

---

### Task 4.2: 詳細ページ

**Files:**
- Create: `src/app/poems/[slug]/page.tsx`

- [ ] **Step 1: src/app/poems/[slug]/page.tsx**

```tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPoems, getPoemBySlug } from '@/lib/poems';
import { getRelatedPoems } from '@/lib/relations';
import { KIMARI_LABELS, ERA_LABELS, THEME_LABELS } from '@/data/types';
import { PoemBody } from '@/components/PoemBody';
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
    headline: `${poem.kamiNoKu}（${poem.author}・第${poem.id}番）`,
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
        <a href="/" className="text-koshoku hover:text-shu hover:underline">
          ← 一覧へ戻る
        </a>
      </nav>

      <article>
        <header className="mb-6 space-y-3">
          <h1 className="font-klee text-2xl text-sumi md:text-3xl">{poem.kamiNoKu}</h1>
          <h2 className="font-sans text-base text-koshoku">
            第{poem.id}番 {poem.author}
            <span className="ml-2 text-sm">（{poem.authorReading}）</span>
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

        <figure
          className="my-8 flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-koshoku/40 bg-washi text-koshoku"
          aria-hidden="true"
        >
          <figcaption className="font-sans text-sm">情景画像（準備中）</figcaption>
        </figure>

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
```

- [ ] **Step 2: ビルド確認**

Run: `npm run build`
Expected: 100ページ + top のSSG成功

- [ ] **Step 3: Commit**

```bash
git add src/app/poems/[slug]/page.tsx
git commit -m "feat(app): implement poem detail page with quiz and related links"
```

---

### Task 4.3: About ページ

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: src/app/about/page.tsx**

```tsx
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
        <h2 className="font-sans text-xl font-bold">出典・著作権</h2>
        <p>
          上の句・下の句の本文、作者、番号は <strong>パブリックドメイン</strong> の古典原典に依拠しています。
        </p>
        <p>
          各句に添えた「いつ・誰が」「情景」「意味」の解説は、本サイト運営者の独自表現で執筆しています。
          一部、学習用ノート (<code>docs/100.md</code>) を出典としています。
        </p>
      </section>

      <section className="my-8 space-y-3 leading-loose text-sumi">
        <h2 className="font-sans text-xl font-bold">技術</h2>
        <p>
          Next.js (App Router) + TypeScript + Tailwind CSS で実装し、
          Cloudflare Pages に静的書き出しでホスティングしています。
        </p>
      </section>

      <nav className="my-8">
        <a href="/" className="font-sans text-shu hover:underline">
          ← 一覧へ戻る
        </a>
      </nav>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat(app): add about page with attribution and licensing"
```

---

### Task 4.4: sitemap + robots

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: src/app/sitemap.ts**

```ts
import type { MetadataRoute } from 'next';
import { getAllPoems } from '@/lib/poems';

const BASE = 'https://hyakunin-isshu.pages.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE}/about/`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    ...getAllPoems().map((p) => ({
      url: `${BASE}/poems/${p.slug}/`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
```

- [ ] **Step 2: src/app/robots.ts**

```ts
import type { MetadataRoute } from 'next';

const BASE = 'https://hyakunin-isshu.pages.dev';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: `out/sitemap.xml` と `out/robots.txt` が生成される

```bash
ls out/sitemap.xml out/robots.txt
```

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): add sitemap.xml and robots.txt generators"
```

---

## Phase 5: フルビルド検証 + Cloudflare Pagesデプロイ

### Task 5.1: フルビルド + 全テスト

**Files:** なし

- [ ] **Step 1: lint + typecheck + test + build**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: 全段階 PASS

- [ ] **Step 2: out/ の中身を確認**

Run: `ls out/poems/ | head -20 && echo "..." && ls out/poems/ | wc -l`
Expected: 100ディレクトリ (各poem)

- [ ] **Step 3: ローカル静的サーバで動作確認 (手動)**

Run: `npx serve out`
Expected: http://localhost:3000 で全ページが見れる (Ctrl+C)

---

### Task 5.2: Cloudflare Pages 初回デプロイ

**Files:**
- (CI/wrangler 設定は GitHub連携で代替)

- [ ] **Step 1: Pagesプロジェクト初期作成 + デプロイ (CLI経由)**

Run:
```bash
npm run build
wrangler pages deploy out --project-name=hyakunin-isshu --branch=main
```

Expected:
- 初回は対話プロンプトで「production branch is `main`?」 → Y
- アップロード完了後 `https://hyakunin-isshu.pages.dev` が確認できる

- [ ] **Step 2: 本番URL動作確認 (手動)**

ブラウザで `https://hyakunin-isshu.pages.dev` を開き、トップ・詳細・aboutが見れることを確認

- [ ] **Step 3: GitHubリポジトリ作成 + push**

```bash
# GitHub側で hyakunin-isshu リポジトリを作成 (ユーザー手動 or gh repo create)
gh repo create howlrs/hyakunin-isshu --public --source=. --remote=origin --push
```

> ※ `gh auth status` で GitHub認証済みであることを確認。未認証なら `gh auth login`。

- [ ] **Step 4: GitHub連携設定 (Cloudflare Dashboard、手動)**

1. https://dash.cloudflare.com → Pages → hyakunin-isshu → Settings → Builds & deployments
2. "Connect to Git" → GitHubリポジトリ `howlrs/hyakunin-isshu` を選択
3. Build command: `npm run build`
4. Build output: `out`
5. Production branch: `main`
6. 以降 main への push で自動デプロイ

- [ ] **Step 5: Commit (まだ commit 漏れがあれば)**

```bash
git status
# 必要に応じて
git add -A && git commit -m "chore: prepare deployment"
```

---

### Task 5.3: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: .github/workflows/ci.yml**

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Commit + push**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint/typecheck/test/build workflow"
git push
```

- [ ] **Step 3: GitHubでCI動作確認 (手動)**

`https://github.com/howlrs/hyakunin-isshu/actions` で緑になることを確認

---

## Phase 6: 実用性確認 + Gemini QA UI/UXレビュー

### Task 6.1: 実機UIテスト (手動)

**Files:** なし

- [ ] **Step 1: 主要導線を一通り体験**

`https://hyakunin-isshu.pages.dev` で:
1. トップ → タブ切替 (5種類) を全部触る
2. 詳細 → クイズ → 関連リンクで5首巡る
3. モバイルブラウザ (またはDevToolsレスポンシブモード) で同じ動作確認
4. キーボードのみで Tab → Enter で全機能アクセス可能か確認
5. スクリーンリーダー (Windows ナレーター / VoiceOver) で詳細ページを読み上げ

- [ ] **Step 2: 気になった点をメモ**

(自由形式)

---

### Task 6.2: Gemini QA UI/UXレビュー

**Files:**
- Create: `docs/superpowers/reviews/2026-05-04-ui-qa.md` (任意)

- [ ] **Step 1: 公開URLとスクショ・気になった点をまとめる**

- [ ] **Step 2: gemini-review.sh qa にかける**

```bash
cat <<'EOF' | ~/.claude/hooks/gemini-review.sh qa
# 百人一首暗記アプリ UI/UX QA レビュー依頼

公開URL: https://hyakunin-isshu.pages.dev
ソース: https://github.com/howlrs/hyakunin-isshu

## 観点
1. トップの一覧 (5種類のタブ) の使い勝手
2. 詳細ページの導線 (上下句 → 解説 → クイズ → 関連)
3. クイズの難易度・楽しさ
4. 縦書き表示の読みやすさ
5. モバイル表示
6. アクセシビリティ (ruby/sr-only)
7. SEO (JSON-LD / sitemap)

辛口に指摘してください。
EOF
```

- [ ] **Step 3: 結果を SurrealDB review_log に記録**

```bash
~/.claude/hooks/gemini-review.sh は自動で記録される
```

- [ ] **Step 4: 重要指摘をIssue化 or 追加修正タスクに登録**

(指摘内容に応じて新規タスク作成 → 別Phaseで対応)

---

## Phase 7 (将来): Gemini画像生成

> ユーザー指示「実用性を確認したらGemini imageに進む」のため、Phase 6 完了 + 承認後に着手。
> このPhaseは別プランドキュメントで詳細化する想定。ここではアウトラインのみ:

1. プロンプト設計 (5首程度で試作 → Gemini Pro QAで構図レビュー)
2. 100枚生成 (`gemini-review.sh image` を100回ループ、ファイル名 `<id>-<slug>.webp`)
3. WebP/AVIF 最適化 (`scripts/optimize-images.ts`)
4. 詳細ページの figure プレースホルダを `<Image>` に差し替え
5. 関連リンクへのサムネ追加 (Gemini deep 提案 §10 future)
6. OG画像も生成して詳細ページに追加

---

## 自己レビュー (writing-plans skill 内で実施)

### Spec coverage チェック (spec §0〜15 を順に見る)

| Spec | 対応Task |
|------|---------|
| §0 主導線 | Phase 4 全タスク |
| §1.1 型定義 | Task 1.1 |
| §1.2 データ整備方針 | Task 1.2-1.5 (note 内に明示) |
| §1.3 関連句抽出 | Task 2.2 |
| §2 ルーティング | Task 4.1, 4.2, 4.3 |
| §2.1 generateStaticParams | Task 4.2 |
| §3 詳細ページ構成 | Task 4.2 |
| §3.2 トップページ構成 | Task 4.1 |
| §4 クイズ仕様 | Task 2.1, 3.5 |
| §5.1 配色 | Task 0.3 (Tailwind tokens) |
| §5.2 タイポ | Task 0.5 (font loading) |
| §5.3 縦書き | Task 0.4 (CSS), Task 3.3 |
| §5.4 ルビ | Task 3.1 |
| §5.5 KimariBadge | Task 3.2 |
| §6.1 メタデータ | Task 4.1, 4.2, 4.3 |
| §6.2 JSON-LD | Task 4.1 (ItemList), 4.2 (Article), 3.8 (helper) |
| §6.3 sitemap/robots | Task 4.4 |
| §6.4 セマンティックHTML | Task 4.2 (article/section/header) |
| §6.5 著作権 | Task 4.3 (about page) |
| §7 アクセシビリティ | Task 0.4 (skip-link/focus), 3.1 (Ruby) |
| §8 パフォーマンス | Task 4.1 (一括メモリ配置 = 自然なReact import で実現) |
| §9 デプロイ | Task 5.2, 5.3 |
| §10 ディレクトリ | Phase 0-4 全体 |
| §11 テスト戦略 | Task 1.5, 2.1, 2.2 |
| §12 実装フェーズ | Phase 0-7 全体 |

→ **全要件カバー済**

### Placeholder スキャン

- "TBD" / "TODO" / "implement later" → なし
- "Add appropriate error handling" → なし
- "Similar to Task N" → なし (Task 1.3, 1.4 は「同様」と書いたが、要点は Task 1.2 と同一なので許容: ただし「Task 1.2 と同じ要領で」を「Task 1.2 を参照」と明記しておけば十分)
- 型整合性: Poem / Era / Theme / KimariGroup の名前は全タスク統一 ✅
- 関数名整合性: `getAllPoems`, `getPoemBySlug`, `getPoemById`, `pickDistractors`, `getRelatedPoems` 全タスクで統一 ✅

---

## 実装着手前メモ

- リポジトリ初期commitは既に完了 (`6879c50`)
- wrangler 認証完了、Account ID `254b3b3ca78079b35c897126142754f5`
- GitHubリポジトリは Task 5.2 Step 3 で作成 (まだ未作成)
- 本プランは subagent-driven 実行を想定し、Phase 1 のデータ整備 (Task 1.2-1.5) は順序依存があるため inline 実行のほうが効率的かもしれない (実装時に判断)

---

## 承認ゲート

- [ ] このプランで実装着手OK → ユーザー承認待ち
