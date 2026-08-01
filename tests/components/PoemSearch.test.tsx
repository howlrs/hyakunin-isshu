import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PoemSearch } from '@/components/PoemSearch';

const entries = [
  { id: 1, text: '1 秋の田の 天智天皇 あきの' },
  { id: 2, text: '2 春すぎて 持統天皇 はるす' },
];

afterEach(() => {
  document.getElementById('test-list')?.remove();
});

function addList() {
  const list = document.createElement('ul');
  list.id = 'test-list';
  list.innerHTML = '<li data-poem-id="1">一首目</li><li data-poem-id="2">二首目</li>';
  document.body.append(list);
  return list;
}

describe('PoemSearch', () => {
  it('filters cards, reports the count, and clears without moving focus', () => {
    const list = addList();
    render(<PoemSearch entries={entries} listId="test-list" />);
    const input = screen.getByRole('searchbox', { name: '歌を検索' });

    input.focus();
    fireEvent.change(input, { target: { value: ' 持統 ' } });

    expect(list.children[0]).toHaveProperty('hidden', true);
    expect(list.children[1]).toHaveProperty('hidden', false);
    expect(screen.getByRole('status').textContent).toBe('1首見つかりました');
    expect(document.activeElement).toBe(input);

    fireEvent.click(screen.getByRole('button', { name: 'クリア' }));
    expect(list.children[0]).toHaveProperty('hidden', false);
    expect(list.children[1]).toHaveProperty('hidden', false);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('shows the empty result state', () => {
    addList();
    render(<PoemSearch entries={entries} listId="test-list" />);

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '該当なし' } });
    expect(screen.getByRole('status').textContent).toBe('該当する歌はありません');
  });
});
