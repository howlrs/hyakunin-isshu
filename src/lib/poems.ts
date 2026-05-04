import { POEMS } from '@/data/poems';
import type { Poem } from '@/data/types';

export function getAllPoems(): Poem[] {
  return POEMS;
}

export function getPoemById(id: number): Poem | undefined {
  return POEMS.find((p) => p.id === id);
}

export function getPoemBySlug(slug: string): Poem | undefined {
  return POEMS.find((p) => p.slug === slug);
}
