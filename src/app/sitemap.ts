import type { MetadataRoute } from 'next';
import { getAllPoems } from '@/lib/poems';

export const dynamic = 'force-static';

const BASE = 'https://hyakunin.howlrs.net';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE}/about/`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    ...getAllPoems().map((p) => ({
      url: `${BASE}/poems/${p.slug}/`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
