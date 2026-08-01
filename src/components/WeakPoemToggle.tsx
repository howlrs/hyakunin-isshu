'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  getWeakPoemsServerSnapshot,
  getWeakPoemsSnapshot,
  parseWeakPoems,
  subscribeWeakPoems,
  writeWeakPoems,
} from '@/lib/weakPoems';

export function WeakPoemToggle({ poemId }: { poemId: number }) {
  const raw = useSyncExternalStore(
    subscribeWeakPoems,
    getWeakPoemsSnapshot,
    getWeakPoemsServerSnapshot,
  );
  const saved = parseWeakPoems(raw).poemIds.includes(poemId);
  const [message, setMessage] = useState('');

  const toggle = () => {
    try {
      writeWeakPoems((ids) =>
        ids.includes(poemId) ? ids.filter((id) => id !== poemId) : [...ids, poemId],
      );
      setMessage(saved ? '苦手札から外しました' : '苦手札に追加しました');
    } catch {
      setMessage('苦手札を保存できませんでした。通常の閲覧は続けられます。');
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={saved ? 'この歌を苦手札から外す' : 'この歌を苦手札に追加'}
        className="rounded-full border border-koshoku/40 px-5 py-2 font-sans text-sm text-sumi transition hover:border-shu hover:text-shu"
      >
        {saved ? '✓ 苦手札から外す' : '＋ 苦手札に追加'}
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
