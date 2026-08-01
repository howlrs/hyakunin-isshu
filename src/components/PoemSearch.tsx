'use client';

import { useState } from 'react';
import { searchPoems, type PoemSearchEntry } from '@/lib/search';

interface Props {
  entries: PoemSearchEntry[];
  listId: string;
}

export function PoemSearch({ entries, listId }: Props) {
  const [query, setQuery] = useState('');
  const [resultCount, setResultCount] = useState(entries.length);

  const applySearch = (value: string) => {
    const matchingIds = new Set(searchPoems(entries, value));
    const list = document.getElementById(listId);

    for (const item of list?.querySelectorAll<HTMLElement>('[data-poem-id]') ?? []) {
      item.hidden = !matchingIds.has(Number(item.dataset.poemId));
    }

    setQuery(value);
    setResultCount(matchingIds.size);
  };

  return (
    <div className="mb-6 rounded-lg border border-koshoku/30 bg-washi p-4">
      <label htmlFor="poem-search" className="font-sans text-sm font-bold text-sumi">
        歌を検索
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="poem-search"
          type="search"
          value={query}
          onChange={(event) => applySearch(event.target.value)}
          placeholder="番号・歌・作者・決まり字"
          className="min-w-0 flex-1 rounded border border-koshoku/40 bg-white px-3 py-2 font-sans text-base text-sumi placeholder:text-koshoku/70"
        />
        <button
          type="button"
          onClick={() => applySearch('')}
          disabled={!query}
          className="shrink-0 rounded border border-koshoku/40 px-4 py-2 font-sans text-sm text-sumi transition hover:border-shu hover:text-shu disabled:cursor-not-allowed disabled:opacity-40"
        >
          クリア
        </button>
      </div>
      <p className="mt-2 font-sans text-sm text-koshoku" role="status" aria-live="polite">
        {resultCount > 0 ? `${resultCount}首見つかりました` : '該当する歌はありません'}
      </p>
    </div>
  );
}
