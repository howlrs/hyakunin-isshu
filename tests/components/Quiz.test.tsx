import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { POEMS } from '@/data/poems';
import { Quiz } from '@/components/Quiz';

describe('Quiz', () => {
  it('shows 4 choice buttons', () => {
    render(<Quiz correct={POEMS[0]} all={POEMS} mode="lower-from-upper" />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it('marks correct answer when clicked', () => {
    render(<Quiz correct={POEMS[0]} all={POEMS} mode="lower-from-upper" />);
    const correctButton = screen.getByRole('button', { name: new RegExp(POEMS[0].shimoNoKu) });
    fireEvent.click(correctButton);
    expect(correctButton.getAttribute('data-state')).toBe('correct');
  });
});
