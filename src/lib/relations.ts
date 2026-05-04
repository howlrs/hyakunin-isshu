import type { Poem, Theme } from '@/data/types';

export interface ThemeGroup {
  theme: Theme;
  poems: Poem[];
}

export interface RelatedPoems {
  sameAuthor: Poem[];
  sameTheme: ThemeGroup[];
  sameKimariGroup: Poem[];
  sameEra: Poem[];
}

const MAX_PER_AXIS = 4;

export function getRelatedPoems(target: Poem, all: Poem[]): RelatedPoems {
  const others = all.filter((p) => p.id !== target.id);

  const sameAuthor = others
    .filter((p) => p.author === target.author)
    .slice(0, MAX_PER_AXIS);

  const sameTheme: ThemeGroup[] = target.themes.map((theme) => ({
    theme,
    poems: others.filter((p) => p.themes.includes(theme)).slice(0, MAX_PER_AXIS),
  }));

  const sameKimariGroup = others
    .filter((p) => p.kimariGroup === target.kimariGroup)
    .slice(0, MAX_PER_AXIS);

  const sameEra = others.filter((p) => p.era === target.era).slice(0, MAX_PER_AXIS);

  return { sameAuthor, sameTheme, sameKimariGroup, sameEra };
}
