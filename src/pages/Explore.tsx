import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import type { Collection } from '../lib/types';
import { CollectionCard } from '../components/CollectionCard';
import { EmptyState, Skeleton } from '../components/ui';

const PAGE = 24;

export default function Explore() {
  const { t } = useI18n();
  const [sort, setSort] = useState('volume_24h');
  const q = useInfiniteQuery({
    queryKey: ['collections', 'explore', sort],
    queryFn: ({ pageParam }) => api.get<{ collections: Collection[] }>('/collections', { sort, limit: PAGE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.collections.length === PAGE ? pages.length * PAGE : undefined),
  });
  const cols = q.data?.pages.flatMap((p) => p.collections) ?? [];

  const sorts: [string, string][] = [
    ['volume_24h', t('explore.sortVolume24h')],
    ['volume', t('explore.sortVolume')],
    ['floor', t('explore.sortFloor')],
    ['new', t('explore.sortNew')],
  ];
  // The first three stand on a podium as posters; everyone else follows as tickets, numbered.
  const podium = cols.slice(0, 3);
  const rest = cols.slice(3);

  return (
    <div className="page container ex">
      <header className="ex-head">
        <div className="ex-head__text">
          <h1 className="ex-head__title">{t('explore.title')}</h1>
          <p className="lead">{t('explore.sub')}</p>
        </div>
        <div className="segmented ex-head__sort" role="radiogroup" aria-label={t('col.sort')}>
          {sorts.map(([id, label]) => (
            <button key={id} role="radio" aria-checked={sort === id} aria-pressed={sort === id} onClick={() => setSort(id)}>{label}</button>
          ))}
        </div>
      </header>
      {q.isLoading ? (
        <div className="ex-podium">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} h={320} r={30} />)}</div>
      ) : cols.length === 0 ? (
        <EmptyState title={t('explore.empty')} action={<Link className="btn" to="/create">{t('home.launch')}</Link>} />
      ) : (
        <>
          <div className="ex-podium" key={sort}>
            {podium.map((c, i) => <CollectionCard key={c.address} c={c} poster rank={i + 1} />)}
          </div>
          {rest.length > 0 && (
            <div className="ex-list">
              {rest.map((c, i) => <CollectionCard key={c.address} c={c} rank={i + 4} />)}
            </div>
          )}
        </>
      )}
      {q.hasNextPage && (
        <div style={{ display: 'grid', placeItems: 'center', marginTop: 28 }}>
          <button className="btn btn--outline" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>{t('common.loadMore')}</button>
        </div>
      )}
    </div>
  );
}
