import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WeakPoemToggle } from '@/components/WeakPoemToggle';
import { readWeakPoems } from '@/lib/weakPoems';

describe('WeakPoemToggle', () => {
  beforeEach(() => localStorage.clear());

  it('adds and removes a poem only after an explicit action', () => {
    render(<WeakPoemToggle poemId={17} />);
    expect(readWeakPoems().poemIds).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'この歌を苦手札に追加' }));
    expect(readWeakPoems().poemIds).toEqual([17]);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'この歌を苦手札から外す' }));
    expect(readWeakPoems().poemIds).toEqual([]);
  });

  it('reports a storage failure without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('disabled');
    });
    render(<WeakPoemToggle poemId={1} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('status').textContent).toContain('保存できませんでした');
  });
});
