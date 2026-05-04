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
