export type Era =
  | 'nara'
  | 'heian-early'
  | 'heian-mid'
  | 'heian-late'
  | 'kamakura';

export type Theme =
  | 'love'
  | 'season-spring'
  | 'season-summer'
  | 'season-autumn'
  | 'season-winter'
  | 'travel-farewell'
  | 'nature'
  | 'impermanence'
  | 'court-life'
  | 'lament';

export type KimariGroup =
  | 'ichiji'
  | 'niji'
  | 'sanji'
  | 'yonji'
  | 'goji'
  | 'rokuji'
  | 'shichiji';

export type Source = 'docs/100.md' | 'public-domain';

export interface Poem {
  id: number;
  slug: string;
  kamiNoKu: string;
  shimoNoKu: string;
  kamiKana: string;
  shimoKana: string;
  author: string;
  authorReading: string;
  era: Era;
  themes: Theme[];
  kimariJi: string;
  kimariGroup: KimariGroup;
  whoWhen: string;
  scene: string;
  meaning: string;
  source: Source;
}

export const THEME_LABELS: Record<Theme, string> = {
  'love': '恋',
  'season-spring': '春',
  'season-summer': '夏',
  'season-autumn': '秋',
  'season-winter': '冬',
  'travel-farewell': '旅・別れ',
  'nature': '自然',
  'impermanence': '無常',
  'court-life': '宮廷',
  'lament': '嘆き',
};

export const ERA_LABELS: Record<Era, string> = {
  'nara': '奈良時代',
  'heian-early': '平安初期',
  'heian-mid': '平安中期',
  'heian-late': '平安後期',
  'kamakura': '鎌倉時代',
};

export const KIMARI_LABELS: Record<KimariGroup, string> = {
  'ichiji': '一字決まり',
  'niji': '二字決まり',
  'sanji': '三字決まり',
  'yonji': '四字決まり',
  'goji': '五字決まり',
  'rokuji': '六字決まり',
  'shichiji': '七字決まり',
};
