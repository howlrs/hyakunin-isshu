import { describe, it, expect } from 'vitest';
import { POEMS } from '@/data/poems';

describe('POEMS', () => {
  it('contains exactly 100 poems', () => {
    expect(POEMS).toHaveLength(100);
  });

  it('has unique ids 1-100', () => {
    const ids = POEMS.map((p) => p.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it('has unique slugs', () => {
    const slugs = POEMS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(100);
  });

  it('has all required text fields filled (no empty strings)', () => {
    for (const p of POEMS) {
      expect(p.kamiNoKu, `id=${p.id} kamiNoKu`).not.toBe('');
      expect(p.shimoNoKu, `id=${p.id} shimoNoKu`).not.toBe('');
      expect(p.kamiKana, `id=${p.id} kamiKana`).not.toBe('');
      expect(p.shimoKana, `id=${p.id} shimoKana`).not.toBe('');
      expect(p.author, `id=${p.id} author`).not.toBe('');
      expect(p.authorReading, `id=${p.id} authorReading`).not.toBe('');
      expect(p.kimariJi, `id=${p.id} kimariJi`).not.toBe('');
      expect(p.whoWhen, `id=${p.id} whoWhen`).not.toBe('');
      expect(p.scene, `id=${p.id} scene`).not.toBe('');
      expect(p.meaning, `id=${p.id} meaning`).not.toBe('');
    }
  });

  it('has at least one theme per poem', () => {
    for (const p of POEMS) {
      expect(p.themes.length, `id=${p.id}`).toBeGreaterThanOrEqual(1);
    }
  });

  it('has slug starting with id', () => {
    for (const p of POEMS) {
      expect(p.slug.startsWith(`${p.id}-`), `id=${p.id} slug=${p.slug}`).toBe(true);
    }
  });

  it('kimariGroup count matches kimariJi length', () => {
    const lengthMap: Record<string, number> = {
      ichiji: 1,
      niji: 2,
      sanji: 3,
      yonji: 4,
      goji: 5,
      rokuji: 6,
      shichiji: 7,
    };
    for (const p of POEMS) {
      const expectedLen = lengthMap[p.kimariGroup];
      expect(p.kimariJi.length, `id=${p.id} kimariJi="${p.kimariJi}" group=${p.kimariGroup}`).toBe(
        expectedLen,
      );
    }
  });
});
