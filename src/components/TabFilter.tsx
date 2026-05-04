'use client';

import { useState, useMemo } from 'react';
import type { Poem } from '@/data/types';
import {
  THEME_LABELS,
  ERA_LABELS,
  KIMARI_LABELS,
  type Theme,
  type Era,
  type KimariGroup,
} from '@/data/types';
import { PoemCard } from './PoemCard';

type TabKey = 'number' | 'kimari' | 'author' | 'theme' | 'era';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'number', label: '番号順' },
  { key: 'kimari', label: '決まり字' },
  { key: 'author', label: '作者' },
  { key: 'theme', label: 'テーマ' },
  { key: 'era', label: '時代' },
];

interface Group {
  key: string;
  label: string;
  poems: Poem[];
}

export function TabFilter({ poems }: { poems: Poem[] }) {
  const [tab, setTab] = useState<TabKey>('number');

  const grouped: Group[] = useMemo(() => {
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
      const order: KimariGroup[] = [
        'ichiji',
        'niji',
        'sanji',
        'yonji',
        'goji',
        'rokuji',
        'shichiji',
      ];
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
