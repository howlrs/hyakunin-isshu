import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  parseWeakPoems,
  readWeakPoems,
  WEAK_POEMS_STORAGE_KEY,
  writeWeakPoems,
} from '@/lib/weakPoems';

describe('weak poems storage', () => {
  beforeEach(() => localStorage.clear());

  it('accepts only unique integer poem ids from 1 to 100', () => {
    expect(parseWeakPoems('{"version":1,"poemIds":[1,1,17,0,101,2.5,"3"]}').poemIds).toEqual([
      1, 17,
    ]);
  });

  it.each(['broken', '{"version":2,"poemIds":[1]}', '{"version":1}'])(
    'reads invalid data as empty without overwriting it: %s',
    (stored) => {
      localStorage.setItem(WEAK_POEMS_STORAGE_KEY, stored);
      expect(readWeakPoems().poemIds).toEqual([]);
      expect(localStorage.getItem(WEAK_POEMS_STORAGE_KEY)).toBe(stored);
    },
  );

  it('reads the latest snapshot immediately before an explicit update', () => {
    localStorage.setItem(WEAK_POEMS_STORAGE_KEY, '{"version":1,"poemIds":[1]}');
    writeWeakPoems((ids) => [...ids, 17]);
    expect(readWeakPoems().poemIds).toEqual([1, 17]);
  });

  it('propagates storage write errors', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('disabled');
      }),
    };
    expect(() => writeWeakPoems(() => [1], storage)).toThrow('disabled');
  });
});
