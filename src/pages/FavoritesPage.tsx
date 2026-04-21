// 즐겨찾기 페이지 — 저장해둔 곡·악단·라운드 한곳에
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useFavorites } from '../hooks/useFavorites';
import { OrnamentDivider, EditorialEmptyState } from '../components/editorial';
import songsData from '../data/songs.json';
import orchestrasData from '../data/orchestras.json';
import roundsData from '../data/competition_rounds.json';
import type { Song, Orchestra } from '../types/tango';
import type { FavoriteType } from '../hooks/useFavorites';

const songs = songsData as Song[];
const orchestras = orchestrasData as Orchestra[];
const rounds = (roundsData as any).rounds;

const songMap = new Map(songs.map(s => [s.song_id, s]));
const orchMap = new Map(orchestras.map(o => [o.orchestra_id, o]));
const roundMap = new Map(rounds.map((r: any) => [r.round_id, r]));

const TABS: Array<{ v: FavoriteType | 'all'; l: string }> = [
  { v: 'all', l: '전체' },
  { v: 'song', l: '곡' },
  { v: 'orchestra', l: '악단' },
  { v: 'tanda', l: '탄다' },
  { v: 'round', l: '라운드' },
];

export function FavoritesPage() {
  const { items, toggle } = useFavorites();
  const [tab, setTab] = useState<FavoriteType | 'all'>('all');

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    return items.filter(f => f.type === tab);
  }, [items, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, song: 0, orchestra: 0, tanda: 0, round: 0 };
    for (const f of items) c[f.type] = (c[f.type] || 0) + 1;
    return c;
  }, [items]);

  return (
    <>
      <PageHeader title="즐겨찾기" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              My Library · Favorites
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              내가 <em className="text-tango-rose">아끼는</em> 것들
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              {items.length}개 저장됨
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 탭 */}
          <div className="flex gap-0 border-b border-tango-brass/20 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.v}
                onClick={() => setTab(t.v)}
                className={`px-4 py-3 text-sm font-serif italic whitespace-nowrap transition-all border-b-2 ${
                  tab === t.v
                    ? 'text-tango-paper border-tango-brass'
                    : 'text-tango-cream/50 border-transparent hover:text-tango-paper/80'
                }`}
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {t.l}
                <span className="ml-2 text-[10px] text-tango-brass/70 font-sans not-italic">
                  {counts[t.v] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* 목록 */}
          {filtered.length === 0 ? (
            <EditorialEmptyState
              icon="♡"
              title="아직 즐겨찾기가 없습니다"
              subtitle="곡·악단·탄다 상세 페이지에서 ♡를 눌러 저장하세요"
            />
          ) : (
            <div className="space-y-px bg-tango-brass/15 rounded-sm overflow-hidden">
              {filtered.map((f, i) => {
                const display = resolveDisplay(f);
                return (
                  <div key={`${f.type}-${f.id}-${i}`} className="bg-tango-ink p-4 md:p-5 flex items-start gap-4 group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-tango-burgundy/15 flex items-center justify-center text-tango-rose text-lg">
                      {display.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">
                        {display.typeLabel}
                      </div>
                      <Link
                        to={display.url}
                        className="block font-display italic text-xl text-tango-paper hover:text-tango-brass transition-colors truncate"
                        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        {display.title}
                      </Link>
                      {display.subtitle && (
                        <div className="text-[11px] text-tango-cream/50 mt-0.5 truncate font-sans">
                          {display.subtitle}
                        </div>
                      )}
                      <div className="text-[10px] text-tango-cream/30 mt-1 font-sans">
                        {new Date(f.added_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(f.type, f.id, f.title)}
                      className="text-tango-rose text-xl opacity-60 hover:opacity-100 transition-opacity"
                      title="즐겨찾기 해제"
                    >
                      ♥
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}

function resolveDisplay(f: { type: FavoriteType; id: string; title?: string }) {
  if (f.type === 'song') {
    const s = songMap.get(f.id);
    return {
      icon: '♪',
      typeLabel: 'Song',
      title: s?.title || f.title || f.id,
      subtitle: s ? `${s.orchestra || ''}${s.vocalist ? ' · ' + s.vocalist : ''}${s.recording_date ? ' · ' + s.recording_date : ''}` : '',
      url: `/song/${f.id}`,
    };
  }
  if (f.type === 'orchestra') {
    const o = orchMap.get(f.id);
    return {
      icon: '♫',
      typeLabel: 'Orchestra',
      title: o?.orchestra_name || f.title || f.id,
      subtitle: o?.alt_names?.[0] || '',
      url: `/orchestra?id=${f.id}`,
    };
  }
  if (f.type === 'tanda' || f.type === 'round') {
    const r = roundMap.get(f.id) as any;
    const title = r
      ? `${r.competition} ${r.year} ${r.stage} Ronda ${r.ronda_number}`
      : f.title || f.id;
    const subtitle = r?.songs
      ? r.songs.map((s: any) => s.title).join(' · ')
      : '';
    return {
      icon: '🎼',
      typeLabel: f.type === 'tanda' ? 'Tanda' : 'Round',
      title,
      subtitle,
      url: `/tanda`,
    };
  }
  return {
    icon: '◈',
    typeLabel: f.type,
    title: f.title || f.id,
    subtitle: '',
    url: '/',
  };
}
