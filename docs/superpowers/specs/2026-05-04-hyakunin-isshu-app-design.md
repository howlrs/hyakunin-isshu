# 百人一首暗記Webアプリ — 設計仕様書 v2

- 作成日: 2026-05-04
- 作成者: howlrs (with Claude Code, Gemini deep review)
- ステータス: 承認待ち → 実装プラン作成へ

---

## 0. 背景・目的

百人一首100首を「読み物として味わいながら暗記する」ためのWebアプリ。  
従来の単語帳的な暗記アプリと一線を画し、句から句へ自然に巡る回遊体験で記憶の定着を狙う。

### 主導線
1. トップ100首一覧を眺める
2. 気になった句を選んで詳細ページへ遷移
3. 詳細ページで「いつ・誰が / 情景 / 意味」を読んで情景を味わう
4. 上の句クイズ・下の句クイズで定着を試す
5. ページ末尾の「関連する句」（同作者・同テーマ・同決まり字グループ・同時代）から次の句へ巡る

### スコープ外（YAGNI）
- 進捗管理（localStorage 永続化）
- ログイン / アカウント / SRS（間隔反復学習）
- タイマー / 競技かるた風機能
- 多言語化
- 音声読み上げ（aria 対応で代替）
- ダークモード
- 画像表示（v1 ではプレースホルダのみ。v2 で Gemini 画像生成導入予定）

---

## 1. データモデル

### 1.1 型定義

```ts
// src/data/poems.ts

export type Era =
  | 'nara'
  | 'heian-early'
  | 'heian-mid'
  | 'heian-late'
  | 'kamakura';

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
  | 'ichiji'   // 一字決まり
  | 'niji'     // 二字決まり
  | 'sanji'    // 三字決まり
  | 'yonji'    // 四字決まり
  | 'goji'     // 五字決まり
  | 'rokuji'   // 六字決まり
  | 'shichiji'; // 七字決まり

// ※ 各グループの首数は流派によって若干異なるが、概ね:
//   一字7首 / 二字42首 / 三字37首 / 四字6首 / 五字2首 / 六字5首 / 七字1首
//   実装時に確定リストから自動算出する

export interface Poem {
  /** 百人一首正規番号 (1..100) */
  id: number;

  /** URL slug (`<id>-<上の句先頭2-3単語のローマ字>` 形式、例: "87-murasameno", "1-akinotano") */
  slug: string;

  /** 上の句 (漢字かな交じり、原文準拠) */
  kamiNoKu: string;

  /** 下の句 (漢字かな交じり、原文準拠) */
  shimoNoKu: string;

  /** 上の句ひらがな (決まり字判定・スクリーンリーダー読み上げ用) */
  kamiKana: string;

  /** 下の句ひらがな */
  shimoKana: string;

  /** 作者名 (歴史的表記、例: 「藤原敏行朝臣」) */
  author: string;

  /** 作者よみ */
  authorReading: string;

  /** 時代 */
  era: Era;

  /** テーマ複数タグ */
  themes: Theme[];

  /** 決まり字 (例: "む", "うら", "ちは") */
  kimariJi: string;

  /** 決まり字グループ */
  kimariGroup: KimariGroup;

  /** いつ・誰が (どんな状況で詠まれたか) */
  whoWhen: string;

  /** 情景 (歌に描かれた風景・状況) */
  scene: string;

  /** 意味 (現代語訳・解釈) */
  meaning: string;

  /** 出典明示 */
  source: 'docs/100.md' | 'public-domain';
}

export const POEMS: Poem[] = [
  // 100件ハードコード
];
```

### 1.2 データ整備方針

- `docs/100.md` に記載がある句: 100.md の独自表現 (whoWhen / scene / meaning) をそのまま採用。`source: 'docs/100.md'`
- 100.md に記載がない句 (再掲扱い・登場しない正本句、約30首): 公知の百人一首データから補完。**著作権・SEO重複コンテンツ回避のため、私の言葉で要約・リライト**。`source: 'public-domain'`
- 上の句・下の句本文 / 作者 / 番号 はすべて公知 (パブリックドメイン)
- 4軸タグ (era / themes / kimariJi / kimariGroup) はすべて手動分類

### 1.3 関連句抽出ロジック

```ts
// src/lib/relations.ts

export interface RelatedPoems {
  sameAuthor: Poem[];
  sameTheme: { theme: Theme; poems: Poem[] }[];
  sameKimariGroup: Poem[];
  sameEra: Poem[];
}

export function getRelatedPoems(poem: Poem): RelatedPoems;
```

各リスト最大4件まで。元の句は除外。`themes` は配列なので「最も特徴的なテーマ」優先で1〜2軸表示。

---

## 2. ルーティング

| パス | 説明 |
|------|------|
| `/` | 100首一覧。タブで「番号順 / 決まり字グループ別 / 作者別 / テーマ別」切替 |
| `/poems/[slug]` | 詳細ページ。slug = `<id>-<上の句ローマ字>` 形式 (例: `87-murasameno`) |
| `/about` | 出典・著作権の明示、サイトコンセプト |

### 2.1 SSG設定

```ts
// src/app/poems/[slug]/page.tsx
export async function generateStaticParams() {
  return POEMS.map((p) => ({ slug: p.slug }));
}
```

100ページすべてビルド時に静的書き出し。

---

## 3. 詳細ページ構成

### 3.1 セクション順序とHTML階層

```html
<article>
  <!-- ヘッダー -->
  <header>
    <h1>むらさめの 露もまだひぬ 真木の葉に</h1>  <!-- 上の句 (SEO重視) -->
    <h2>第87番 寂蓮法師</h2>
    <span class="kimari-badge">三字決まり「むら」</span>
  </header>

  <!-- 句本文ブロック (縦書き) -->
  <section class="poem-body" style="writing-mode: vertical-rl;">
    <p class="kami">
      むらさめの <Ruby base="露" reading="つゆ" />もまだひぬ
      <Ruby base="真木" reading="まき" />の<Ruby base="葉" reading="は" />に
    </p>
    <p class="shimo">
      <Ruby base="霧" reading="きり" />立ちのぼる <Ruby base="秋" reading="あき" />の<Ruby base="夕暮" reading="ゆふぐれ" />
    </p>
  </section>

  <!-- 画像挿入予定エリア (v2でGemini画像対応) -->
  <figure class="image-placeholder" aria-hidden="true">
    <div class="placeholder-text">情景画像（準備中）</div>
  </figure>

  <!-- 解説 -->
  <section><h2>いつ・誰が</h2><p>...</p></section>
  <section><h2>情景</h2><p>...</p></section>
  <section><h2>意味</h2><p>...</p></section>

  <!-- クイズ -->
  <section>
    <h2>クイズで覚える</h2>
    <Quiz mode="upper-from-lower" />
    <Quiz mode="lower-from-upper" />
    <p class="streak">🔥 セッション連続正解: <span>3</span></p>
  </section>

  <!-- 関連 -->
  <section>
    <h2>関連する句</h2>
    <RelatedPoemsSection ... />
  </section>
</article>
```

### 3.2 トップページ構成

```html
<main>
  <h1>百人一首 100首</h1>
  <p class="lead">情景を味わいながら、100首を覚える</p>
  
  <nav class="tab-filter">
    <!-- 番号順 / 決まり字 / 作者 / テーマ -->
  </nav>
  
  <ul class="poem-list">
    <li><a href="/poems/1-akinotano">
      <span class="number">1</span>
      <span class="kami-summary">秋の田の かりほの庵の</span>
      <span class="author">天智天皇</span>
    </a></li>
    ...
  </ul>
</main>
```

---

## 4. クイズ仕様

### 4.1 形式

- **上の句クイズ (`upper-from-lower`)**: 下の句を提示 → 上の句を4択で当てる
- **下の句クイズ (`lower-from-upper`)**: 上の句を提示 → 下の句を4択で当てる
- 4択 = 正解1 + ダミー3
- 即時フィードバック: 正解→緑、誤答→赤＋正解表示

### 4.2 ダミー抽出ロジック

```ts
// src/lib/quiz.ts

export function pickDistractors(correct: Poem, all: Poem[], count = 3): Poem[] {
  // 60% 同テーマから (適度な紛らわしさ・学習効果あり)
  // 30% ランダム (一般識別力)
  // 10% 同決まり字グループから (時々入る難問)
  
  // ※ 上の句クイズで「同決まり字グループ」を多用すると初学者には辛すぎるため
  //   比率を下げ、ランダム性で難易度を均す
}
```

### 4.3 状態管理

- `useState` のみ (localStorage 不使用)
- セッション内連続正解数 `streak` を表示 (回遊・滞在モチベ向上のため)
- ページリロード or 別ページ遷移でリセット

---

## 5. UI/ビジュアル

### 5.1 配色

| 役割 | 色 | 説明 |
|------|----|----|
| 背景 | `#FAF6E9` | 和紙ベージュ |
| 本文 | `#1F1B16` | 墨色 |
| アクセント | `#C7402A` | 朱色 (決まり字バッジ・hover) |
| サブ | `#8C6E3F` | 古色 (関連リンク罫線・サブテキスト) |

### 5.2 タイポグラフィ

- 句本文: **Klee One** (手書き風・古典の雰囲気)
- 解説本文: **Noto Serif JP** (明朝・読みやすさと雅さ両立)
- UI (ボタン・タブ): **Noto Sans JP** (clean)
- font-display: swap で FOIT 回避

### 5.3 縦書き

- 適用範囲: 句本文ブロック (`section.poem-body`) のみ
- CSS: `writing-mode: vertical-rl; text-orientation: upright;`
- モバイル時は `max-height: 60vh; overflow-x: auto;` で崩れ防止
- 解説本文は横書き継続 (縦書き解説は読みづらい)

### 5.4 ルビ (アクセシビリティ対応)

```tsx
// src/components/Ruby.tsx
export function Ruby({ base, reading }: { base: string; reading: string }) {
  return (
    <>
      <ruby aria-hidden="true">
        {base}<rt>{reading}</rt>
      </ruby>
      <span className="sr-only">{reading}</span>
    </>
  );
}
```

スクリーンリーダーは `aria-hidden="true"` の ruby を読まず、`sr-only` のひらがな読みを読む。「あきあきの」のような重複読み事故を防ぐ。

### 5.5 決まり字バッジ

- 一字決まり: 朱色背景・白文字 (最も目立つ・「七種の神器」とも呼ばれる暗記の核)
- 二字決まり: 朱色枠・墨色文字
- 三字決まり〜七字決まり: 古色枠・墨色文字
- 視覚的に「一字 > 二字 > その他」のヒエラルキーを表現

---

## 6. SEO設計

### 6.1 メタデータ

```ts
// src/app/poems/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const poem = getPoemBySlug(params.slug);
  return {
    title: `${poem.kamiNoKu}（${poem.author}・第${poem.id}番） | 百人一首暗記`,
    description: `${poem.kamiNoKu} ${poem.shimoNoKu}。${poem.scene.slice(0, 80)}...`,
    alternates: { canonical: `/poems/${poem.slug}` },
    openGraph: {
      title: `${poem.kamiNoKu}（${poem.author}）`,
      description: poem.meaning,
      type: 'article',
    },
  };
}
```

### 6.2 構造化データ (JSON-LD)

詳細ページ:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "むらさめの 露もまだひぬ 真木の葉に（寂蓮法師・第87番）",
  "author": { "@type": "Person", "name": "寂蓮法師" },
  "inLanguage": "ja",
  "isPartOf": {
    "@type": "CreativeWorkSeries",
    "name": "百人一首"
  },
  "citation": {
    "@type": "Quotation",
    "text": "むらさめの 露もまだひぬ 真木の葉に / 霧立ちのぼる 秋の夕暮れ"
  }
}
```

トップ:

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "百人一首 100首",
  "numberOfItems": 100,
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "url": "/poems/1-akinotano" },
    ...
  ]
}
```

### 6.3 sitemap / robots

- `app/sitemap.ts` で全102URL自動生成 (top + about + poems×100)
- `app/robots.ts` で全許可
- canonical は `metadata.alternates.canonical` で各ページ指定

### 6.4 セマンティックHTML

- `<article>` `<section>` `<header>` `<nav>` `<figure>` を適切に使用
- 句本文は `<section class="poem-body">` で実装 (blockquote は引用元URLを要求するニュアンスが強く、パブリックドメインの古典原典には不適)
- 見出し階層: 詳細ページ h1=上の句、h2=各セクションタイトル、h3は使わない

### 6.5 重複コンテンツ・著作権

- 100.md由来の解説: 既に独自表現 (ユーザー自筆)
- 公知データから補完する句: 私 (Claude) が公知情報を要約・独自表現でリライト
- `/about` ページで出典・著作権を明示

---

## 7. アクセシビリティ

- WCAG 2.1 AA を目標
- ルビは Ruby コンポーネントで一括対応 (5.4)
- カラーコントラスト: 本文 `#1F1B16` on `#FAF6E9` = AAA合格
- フォーカススタイル: 朱色のアウトライン
- キーボード操作: Tab / Enter / Space で全機能アクセス可
- skip-link (top → main content)
- `<html lang="ja">`

---

## 8. パフォーマンス

### 8.1 バンドル戦略

- 100首ハードコードは全件まとめて `src/data/poems.ts` に配置
- 推定サイズ: ~80KB (JSON相当)、Gzip後 ~10KB → 問題なし
- 詳細ページごとの動的importは行わない (ページ遷移を爆速にしたい)

### 8.2 ビルド

- `next build` で静的書き出し (`output: 'export'`)
- 100ページ + top + about = 102ページの SSG (数秒で完了見込み)

### 8.3 画像

- v1 では画像なし (プレースホルダのみ)
- v2 で Gemini 画像導入時、ビルド前に WebP/AVIF へ一括変換するパイプライン (`scripts/optimize-images.ts`) を構築予定
- `next/image` は `unoptimized: true` 必須 (`output: 'export'` のため)
- 将来的に Cloudflare Image Resizing カスタムローダー検討

---

## 9. デプロイ

### 9.1 Cloudflare Pages

- `output: 'export'` で `out/` ディレクトリに静的書き出し
- 初回プロジェクト作成 + 動作確認: `wrangler pages deploy out --project-name=hyakunin-isshu` (CLI経由)
- 本運用: **GitHub連携で main ブランチへの push で自動デプロイ** (Cloudflare Dashboard でリポジトリ接続を1度設定すれば以降CLI不要)

### 9.2 ドメイン

- 暫定: `hyakunin-isshu.pages.dev` (Cloudflare Pages 自動付与)
- 独自ドメインは将来検討

### 9.3 CI

- GitHub Actions で `npm run lint && npm run typecheck && npm run build` を PR で実行
- main ブランチは Cloudflare Pages の自動デプロイに任せる

---

## 10. ディレクトリ構成

```
hyakunin-isshu/
├─ docs/
│  ├─ 100.md                                            # 学習構成の元データ
│  └─ superpowers/specs/
│     └─ 2026-05-04-hyakunin-isshu-app-design.md       # 本ドキュメント
├─ scripts/
│  └─ verify-poems.ts                                   # 100件のスキーマ検証用 (任意)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                                       # トップ一覧
│  │  ├─ poems/[slug]/page.tsx                          # 詳細
│  │  ├─ about/page.tsx
│  │  ├─ sitemap.ts
│  │  ├─ robots.ts
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ PoemCard.tsx
│  │  ├─ PoemDetail.tsx
│  │  ├─ PoemBody.tsx                                   # 縦書き本文
│  │  ├─ Ruby.tsx                                       # ルビ + a11y
│  │  ├─ KimariBadge.tsx
│  │  ├─ Quiz.tsx
│  │  ├─ RelatedPoemsSection.tsx
│  │  ├─ TabFilter.tsx
│  │  └─ JsonLd.tsx
│  ├─ data/
│  │  └─ poems.ts                                       # 100首ハードコード
│  └─ lib/
│     ├─ poems.ts                                       # getPoemBySlug, getAllPoems
│     ├─ relations.ts                                   # 関連句抽出
│     ├─ quiz.ts                                        # ダミー選択肢抽出
│     └─ romaji.ts                                      # ひらがな→ローマ字 (slug用)
├─ public/
│  └─ images/poems/                                     # 後日Gemini画像配置
├─ tests/
│  ├─ poems.test.ts                                     # 100件揃ってる/重複なし
│  ├─ quiz.test.ts                                      # ダミー抽出ロジック
│  └─ relations.test.ts
├─ .gitignore
├─ README.md
├─ next.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
└─ package.json
```

---

## 11. テスト戦略

軽量 Vitest のみ。E2E は YAGNI。

| テスト対象 | 内容 |
|-----------|------|
| `poems.test.ts` | 100件揃っているか / id重複なし / slug重複なし / 必須フィールド埋まっているか |
| `quiz.test.ts` | ダミー抽出が正解を含まない / 4件返す / 配分が偏らない |
| `relations.test.ts` | 関連句に元の句が含まれない / 各軸最大4件 |

---

## 12. 実装フェーズ分け (ハイレベル)

実装プランで詳細化するが、おおまかな段階:

1. **Phase 0: プロジェクト初期化** — Next.js / Tailwind / TypeScript セットアップ
2. **Phase 1: データ整備** — 100首ハードコード (100.md由来 + 公知補完)
3. **Phase 2: 基本UI** — トップ・詳細・ルーティング
4. **Phase 3: クイズ + 関連リンク** — インタラクション完成
5. **Phase 4: SEO + a11y仕上げ** — JSON-LD / sitemap / Ruby / 縦書き
6. **Phase 5: Cloudflare Pagesデプロイ** — `wrangler pages deploy` + GitHub連携
7. **Phase 6: 実用性確認 → Gemini QA UI/UXレビュー** — 修正
8. **Phase 7 (将来): Gemini画像生成** — 100枚生成・配置・最適化

---

## 13. 採用したGemini deepレビュー指摘 (2026-05-04)

| # | 指摘 | 対応 |
|---|------|------|
| 🔴 SEO URL | 連番→スラッグ化 (`/poems/87-murasameno`) | §2 採用 |
| 🔴 SEO h1 | 上の句を h1、番号・作者は h2 | §3.1 採用 |
| 🔴 著作権 | 解説の独自リライト | §1.2 / §6.5 採用 |
| 🔴 a11y | Rubyコンポーネントで読み上げ事故防止 | §5.4 採用 |
| 🟡 縦書き | 句本文のみ縦書き | §5.3 採用 |
| 🟡 クイズ難易度 | ダミー抽出比率調整 (60/30/10) | §4.2 採用 |
| 🟡 連続正解表示 | useState のみで実装 | §4.3 採用 |
| 🟡 画像最適化 | v2で対応・spec内に明記 | §8.3 / §12 採用 |
| 🟢 バンドル | 一括メモリ配置でOK | §8.1 採用 |
| 🟢 関連カード | サムネは画像導入後 | §10 future work |
| 🟢 JSON-LD | Article + Quotation構造 | §6.2 採用 |

---

## 14. 未確定事項・将来検討

- 画像生成 (Gemini) 後の関連リンクサムネ追加
- ダークモード (現状不要)
- 音声読み上げ機能 (a11y代替で当面OK)
- 独自ドメイン
- ファビコン・OG画像のデザイン

---

## 15. 承認

- [ ] ユーザー承認 → writing-plans skill 起動 → 実装プラン作成
