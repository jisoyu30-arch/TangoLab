// 곡 아카이브 — 에디토리얼 리디자인
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SongFilters } from '../components/tango/SongFilters';
import { SongList } from '../components/tango/SongList';
import { SongRankingChart } from '../components/tango/SongRankingChart';
import { useSongFilters } from '../hooks/useSongFilters';
import { computeRankings } from '../utils/tangoRanking';
import { useRecentItems } from '../hooks/useRecentItems';
import { EditorialHeader, EditorialStat, EditorialInput, OrnamentDivider } from '../components/editorial';

import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import orchestrasData from '../data/orchestras.json';
import competitionsData from '../data/competitions.json';

import type { Song, Appearance, Orchestra, Competition } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const orchestras = orchestrasData as Orchestra[];
const competitions = competitionsData as Competition[];

export function TangoArchivePage() {
  const navigate = useNavigate();
  const rankings = useMemo(() => computeRankings(songs, appearances), []);
  const { filters, setFilters, filtered, resetFilters } = useSongFilters(rankings, songs);
  const { recentItems } = useRecentItems();
  const [showArchive, setShowArchive] = useState(false);

  const years = useMemo(() => {
    const s = new Set<number>();
    for (const a of appearances) s.add(a.year);
    return Array.from(s).sort((a, b) => b - a);
  }, []);

  const topOrchestra = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of appearances) {
      const song = songs.find(s => s.song_id === a.song_id);
      const orch = song?.orchestra ?? 'Unknown';
      counts.set(orch, (counts.get(orch) ?? 0) + 1);
    }
    let max = '', maxCount = 0;
    for (const [k, v] of counts) {
      if (v > maxCount) { max = k; maxCount = v; }
    }
    return max;
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return songs
      .filter(s => s.title.toLowerCase().includes(q) || s.orchestra?.toLowerCase().includes(q) || s.vocalist?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery]);

  return (
    <>
      <PageHeader title="곡 아카이브" />

      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14 space-y-10">

          {/* HERO */}
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Section No. 01 · Archive
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              Song <em className="text-tango-brass">Archive</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic max-w-xl mx-auto">
              {songs.length}곡 · {appearances.length}건의 대회 기록
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <EditorialStat value={songs.length} label="총 곡" />
            <EditorialStat value={appearances.length} label="출현 기록" />
            <EditorialStat value={topOrchestra.split(' ')[0] || '—'} label="TOP 악단" small />
            <EditorialStat value={`${Math.min(...years)}–${Math.max(...years)}`} label="커버 연도" small />
          </div>

          {/* 검색 */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tango-brass">◈</span>
              <div className="pl-7">
                <EditorialInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="곡, 악단, 보컬리스트 검색…"
                />
              </div>
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-tango-shadow border border-tango-brass/20 rounded-sm shadow-2xl z-20 max-h-80 overflow-y-auto">
                {searchResults.map(s => (
                  <button
                    key={s.song_id}
                    onClick={() => { navigate(`/song/${s.song_id}`); setSearchQuery(''); }}
                    className="w-full text-left px-5 py-3 hover:bg-tango-brass/10 transition-colors border-b border-tango-brass/10 last:border-0"
                  >
                    <div className="font-serif text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {s.title}
                    </div>
                    <div className="text-[11px] text-tango-cream/50 mt-0.5 font-sans">
                      {s.orchestra || '미상'}
                      {s.vocalist && <span className="text-tango-rose"> · {s.vocalist}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FEATURED 4x */}
          <div>
            <EditorialHeader
              eyebrow="Quick Navigation"
              title="연구 메뉴"
              subtitle="관심 있는 영역으로 바로 이동"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-tango-brass/15 mt-8 rounded-sm overflow-hidden">
              <FeatureCell to="/tanda" num="01" title="Tandas" subtitle="탄다 연구소" desc="3곡 조합 패턴" />
              <FeatureCell to="/orchestra" num="02" title="Orchestras" subtitle="악단 연구" desc="스타일·전략" />
              <FeatureCell to="/compare" num="03" title="Compare" subtitle="비교 연습실" desc="레퍼런스 vs 우리" />
              <FeatureCell to="/practice" num="04" title="Practice" subtitle="연습 보드" desc="후보곡 관리" />
            </div>
          </div>

          {/* 최근 본 항목 */}
          {recentItems.length > 0 && (
            <div>
              <EditorialHeader
                eyebrow="Recently Viewed"
                title="최근 본 곡"
                align="left"
              />
              <div className="flex gap-3 overflow-x-auto pb-2 mt-6 -mx-2 px-2">
                {recentItems.slice(0, 10).map(item => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.type === 'song' ? `/song/${item.id}` : item.type === 'orchestra' ? `/orchestra` : '/'}
                    className="flex-shrink-0 bg-tango-shadow/60 border border-tango-brass/15 hover:border-tango-brass/40 rounded-sm px-4 py-3 transition-colors min-w-[160px]"
                  >
                    <div className="text-[9px] tracking-widest uppercase text-tango-cream/40 font-sans">
                      {item.type === 'song' ? 'Song' : item.type === 'orchestra' ? 'Orchestra' : 'Video'}
                    </div>
                    <div className="font-serif italic text-sm text-tango-paper truncate mt-0.5" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {item.title}
                    </div>
                    {item.subtitle && <div className="text-[10px] text-tango-cream/40 truncate font-sans mt-0.5">{item.subtitle}</div>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 아카이브 토글 */}
          <div>
            <button
              onClick={() => setShowArchive(!showArchive)}
              className="w-full text-left border border-tango-brass/20 bg-tango-shadow/40 hover:bg-tango-shadow/60 rounded-sm p-5 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
                  Full Archive
                </div>
                <div className="font-serif italic text-xl text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  전체 곡 데이터베이스
                </div>
                <div className="text-xs text-tango-cream/50 mt-1 font-sans">
                  필터, 차트, 상세 목록 · {filtered.length} / {rankings.length}
                </div>
              </div>
              <span className="text-tango-brass text-2xl">{showArchive ? '—' : '+'}</span>
            </button>

            {showArchive && (
              <div className="space-y-6 mt-6">
                <SongFilters
                  filters={filters}
                  setFilters={setFilters}
                  resetFilters={resetFilters}
                  orchestras={orchestras}
                  competitions={competitions}
                  resultCount={filtered.length}
                  years={years}
                />
                <SongRankingChart rankings={filtered} />
                <div className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4">
                  <SongList rankings={filtered} />
                </div>
              </div>
            )}
          </div>

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}

function FeatureCell({ to, num, title, subtitle, desc }: { to: string; num: string; title: string; subtitle: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group block bg-tango-ink hover:bg-tango-shadow p-6 md:p-8 transition-all min-h-[160px] flex flex-col justify-between"
    >
      <div className="text-[11px] tracking-[0.25em] uppercase text-tango-brass/80 font-sans">
        No. {num}
      </div>
      <div>
        <h3 className="font-display text-2xl md:text-3xl text-tango-paper italic group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          {title}
        </h3>
        <div className="text-sm text-tango-cream/70 font-serif italic mt-1">{subtitle}</div>
        <div className="text-[10px] text-tango-cream/40 font-sans mt-2">{desc}</div>
      </div>
    </Link>
  );
}
