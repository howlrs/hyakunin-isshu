import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { parsePoemParam, QuizSession } from '@/components/QuizSession';
import { POEMS } from '@/data/poems';

function currentPoem() {
  const prompt = screen.getByTestId('quiz-prompt').textContent;
  return POEMS.slice(0, 4).find((poem) => poem.kamiNoKu === prompt || poem.shimoNoKu === prompt);
}

function answerCurrentQuestion(correct: boolean) {
  const poem = currentPoem();
  expect(poem).toBeDefined();

  const choiceButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[data-state]'),
  );
  const correctButton = choiceButtons.find(
    (button) =>
      button.textContent?.includes(poem!.kamiNoKu) || button.textContent?.includes(poem!.shimoNoKu),
  );
  expect(correctButton).toBeDefined();

  const button = correct
    ? correctButton!
    : choiceButtons.find((choice) => choice !== correctButton)!;
  fireEvent.click(button);
}

describe('QuizSession', () => {
  it.each([
    ['', { invalid: false }],
    ['?poem=17', { id: 17, invalid: false }],
    ['?poem=0', { invalid: true }],
    ['?poem=abc', { invalid: true }],
  ])('parses poem target %s', (search, expected) => {
    expect(parsePoemParam(search)).toEqual(expected);
  });

  it('starts one fixed-direction question from a valid shared URL', async () => {
    window.history.replaceState({}, '', '/quiz/?poem=17');
    render(<QuizSession allPoems={POEMS} random={() => 0} />);

    await screen.findByText('第 1 問 / 全 1 問');
    expect(screen.getByText(/第17番.*在原業平朝臣/)).not.toBeNull();
    expect(screen.getByText('上の句 → 下の句')).not.toBeNull();
    expect(screen.getAllByRole('button').filter((button) => button.dataset.state)).toHaveLength(4);
    window.history.replaceState({}, '', '/quiz/');
  });

  it('falls back to random questions for an invalid poem id', async () => {
    window.history.replaceState({}, '', '/quiz/?poem=999');
    render(<QuizSession allPoems={POEMS.slice(0, 10)} random={() => 0} />);
    expect((await screen.findByRole('status')).textContent).toContain('歌番号が不正');
    expect(screen.getByText('第 1 問 / 全 10 問')).not.toBeNull();
    window.history.replaceState({}, '', '/quiz/');
  });

  it('starts from saved weak poems and respects clear confirmation cancellation', async () => {
    window.history.replaceState({}, '', '/quiz/');
    localStorage.setItem(
      'hyakunin-isshu:weak-poems:v1',
      JSON.stringify({ version: 1, poemIds: [1, 17] }),
    );
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<QuizSession allPoems={POEMS} random={() => 0} />);

    await screen.findByText('苦手札: 2首');
    fireEvent.click(screen.getByRole('button', { name: '苦手札を全件クリア' }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(localStorage.getItem('hyakunin-isshu:weak-poems:v1')).toContain('[1,17]');

    fireEvent.click(screen.getByRole('button', { name: '苦手札から復習' }));
    expect(screen.getByText('第 1 問 / 全 2 問')).not.toBeNull();
    confirm.mockRestore();
    localStorage.clear();
  });
  it('shows wrong answers and starts a quiz containing only those poems', async () => {
    render(<QuizSession allPoems={POEMS.slice(0, 4)} random={() => 0} />);

    await screen.findByText('第 1 問 / 全 4 問');
    answerCurrentQuestion(false);
    const wrongPoem = currentPoem()!;
    const expectedAnswer =
      screen.getByTestId('quiz-prompt').textContent === wrongPoem.kamiNoKu
        ? wrongPoem.shimoNoKu
        : wrongPoem.kamiNoKu;
    expect(screen.getByRole('status').textContent).toContain('不正解');
    expect(screen.getByRole('status').textContent).toContain(`正解は「${expectedAnswer}」`);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
    fireEvent.click(screen.getByRole('button', { name: '次の問題へ' }));

    for (let questionNumber = 2; questionNumber <= 4; questionNumber += 1) {
      answerCurrentQuestion(true);
      fireEvent.click(
        screen.getByRole('button', {
          name: questionNumber === 4 ? '結果を見る' : '次の問題へ',
        }),
      );
    }

    expect(screen.getByRole('heading', { name: '間違えた歌' })).not.toBeNull();
    expect(screen.getByText(`第${wrongPoem.id}番 ${wrongPoem.author}`)).not.toBeNull();
    expect(screen.getByText(wrongPoem.kamiNoKu)).not.toBeNull();
    expect(screen.getByText(wrongPoem.shimoNoKu)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '間違えた1首を復習' }));

    await waitFor(() => {
      expect(screen.getByText('第 1 問 / 全 1 問')).not.toBeNull();
    });
    expect(currentPoem()?.id).toBe(wrongPoem.id);

    answerCurrentQuestion(true);
    fireEvent.click(screen.getByRole('button', { name: '結果を見る' }));
    expect(screen.getByText('1 / 1')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '新しい4問に挑戦' }));
    await screen.findByText('第 1 問 / 全 4 問');
  });

  it('shows a completion message without a review button after a perfect score', async () => {
    render(<QuizSession allPoems={POEMS.slice(0, 1)} random={() => 0} />);

    await screen.findByText('第 1 問 / 全 1 問');
    answerCurrentQuestion(true);
    fireEvent.click(screen.getByRole('button', { name: '結果を見る' }));

    expect(screen.getByText(/全問正解です/)).not.toBeNull();
    expect(screen.queryByRole('button', { name: /復習/ })).toBeNull();
  });

  it('shows an empty state when there are no poems', async () => {
    render(<QuizSession allPoems={[]} random={() => 0} />);

    expect(await screen.findByText('出題できる歌がありません。')).not.toBeNull();
  });

  it('hydrates without a mismatch even when the client random sequence differs', async () => {
    const poems = POEMS.slice(0, 4);
    const serverHtml = renderToString(<QuizSession allPoems={poems} random={() => 0} />);
    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.append(container);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const root = hydrateRoot(container, <QuizSession allPoems={poems} random={() => 0.75} />);

    try {
      await waitFor(() => {
        expect(container.textContent).toContain('第 1 問 / 全 4 問');
      });
      expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/hydration|did not match/i);
    } finally {
      await act(async () => root.unmount());
      consoleError.mockRestore();
      container.remove();
    }
  });
});
