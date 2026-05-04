import Link from 'next/link';
import type { Poem } from '@/data/types';
import { THEME_LABELS, ERA_LABELS, KIMARI_LABELS } from '@/data/types';
import type { RelatedPoems } from '@/lib/relations';

function PoemMiniLink({ poem }: { poem: Poem }) {
  return (
    <Link
      href={`/poems/${poem.slug}/`}
      className="block rounded border border-koshoku/30 px-3 py-2 font-klee text-sumi hover:border-shu hover:text-shu"
    >
      <span className="text-xs text-koshoku">第{poem.id}番</span>
      <span className="ml-2">{poem.kamiNoKu}</span>
      <span className="ml-2 text-xs text-koshoku">— {poem.author}</span>
    </Link>
  );
}

export function RelatedPoemsSection({
  related,
  target,
}: {
  related: RelatedPoems;
  target: Poem;
}) {
  return (
    <section className="my-8 space-y-6">
      <h2 className="font-sans text-xl font-bold text-sumi">関連する句</h2>

      {related.sameAuthor.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
            同じ作者「{target.author}」
          </h3>
          <ul className="space-y-1">
            {related.sameAuthor.map((p) => (
              <li key={p.id}>
                <PoemMiniLink poem={p} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {related.sameTheme.map(({ theme, poems }) =>
        poems.length > 0 ? (
          <div key={theme}>
            <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
              同じテーマ「{THEME_LABELS[theme]}」
            </h3>
            <ul className="space-y-1">
              {poems.map((p) => (
                <li key={p.id}>
                  <PoemMiniLink poem={p} />
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}

      {related.sameKimariGroup.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
            同じ{KIMARI_LABELS[target.kimariGroup]}
          </h3>
          <ul className="space-y-1">
            {related.sameKimariGroup.map((p) => (
              <li key={p.id}>
                <PoemMiniLink poem={p} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {related.sameEra.length > 0 && (
        <div>
          <h3 className="mb-2 font-sans text-sm font-bold text-koshoku">
            同じ{ERA_LABELS[target.era]}
          </h3>
          <ul className="space-y-1">
            {related.sameEra.map((p) => (
              <li key={p.id}>
                <PoemMiniLink poem={p} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
