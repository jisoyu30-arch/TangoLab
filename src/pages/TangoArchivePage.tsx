import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SongFilters } from '../components/tango/SongFilters';
import { SongList } from '../components/tango/SongList';
import { SongRankingChart } from '../components/tango/SongRankingChart';
import { useSongFilters } from '../hooks/useSongFilters';
import { computeRankings } from '../utils/tangoRanking';
import { useRecentItems } from '../hooks/useRecentItems';

import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import orchestrasData from '../data/orchestras.json';
import competitionsData from '../data/competitions.json';

import type { Song, Appearance, Orchestra, Competition } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const orchestras = orchestrasData as Orchestra[];
const competitions = competitionsData as Competition[];

const PRACTICE_BOARDS_KEY = 'tango_practice_boards';

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

  // 연습보드 요약 (localStorage 직접 읽기)
  const boardSummary = useMemo(() => {
    try {
      const raw = localStorage.getItem(PRACTICE_BOARDS_KEY);
      if (!raw) return null;
      const boards = JSON.parse(raw);
      if (!boards.length) return null;
      const latest = boards[0];
      return { title: latest.title, songCount: latest.song_ids?.length ?? 0, total: boards.length };
    } catch {
      return null;
    }
  }, []);

  // 검색
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

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-5 space-y-6">

          {/* 검색창 */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="곡, 악단, 보컬리스트 검색..."
              className="w-full bg-white/5 border border-secretary-gold/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-secretary-navy border border-secretary-gold/20 rounded-xl overflow-hidden z-20 shadow-xl">
                {searchResults.map(s => (
                  <button
                    key={s.song_id}
                    onClick={() => { navigate(`/song/${s.song_id}`); setSearchQuery(''); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm text-white">{s.title}</div>
                      <div className="text-xs text-gray-500">{s.orchestra} {s.vocalist ? `/ ${s.vocalist}` : ''}</div>
                    </div>
                    <span className="text-xs text-gray-600">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 빠른 진입 4개 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickCard to="/tanda" icon="🎵" label="대회곡" desc="자주 쓰이는 곡 탐색" />
            <QuickCard to="/orchestra" icon="🎻" label="악단 연구" desc="악단별 특징과 전략" />
            <QuickCard to="/compare" icon="🔍" label="비교 연습실" desc="레퍼런스 vs 우리 춤" />
            <QuickCard to="/practice" icon="📋" label="연습 보드" desc="후보곡 관리와 메모" />
          </div>

          {/* 연습 보드 요약 */}
          {boardSummary && (
            <Link to="/practice" className="block bg-white/5 rounded-xl border border-secretary-gold/10 p-4 hover:bg-white/8 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">최근 연습 보드</div>
                  <div className="text-sm font-semibold text-white">{boardSummary.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{boardSummary.songCount}곡 저장됨 · 보드 {boardSummary.total}개</div>
                </div>
                <span className="text-secretary-gold text-lg">→</span>
              </div>
            </Link>
          )}

          {/* 최근 본 항목 */}
          {recentItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">최근 본 항목</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentItems.slice(0, 10).map(item => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.type === 'song' ? `/song/${item.id}` : item.type === 'orchestra' ? `/orchestra` : '/'}
                    className="flex-shrink-0 bg-white/5 rounded-lg px-3 py-2 border border-white/10 hover:border-secretary-gold/30 transition-colors min-w-[140px]"
                  >
                    <div className="text-xs text-gray-500">{item.type === 'song' ? '곡' : item.type === 'orchestra' ? '악단' : '영상'}</div>
                    <div className="text-sm text-white truncate">{item.title}</div>
                    {item.subtitle && <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="총 곡" value={`${songs.length}곡`} />
            <StatCard label="출현 기록" value={`${appearances.length}건`} />
            <StatCard label="TOP 악단" value={topOrchestra.split(' ')[0]} />
            <StatCard label="커버 연도" value={`${Math.min(...years)}~${Math.max(...years)}`} />
          </div>

          {/* 아카이브 토글 */}
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="w-full text-left bg-white/5 rounded-xl border border-secretary-gold/10 p-4 hover:bg-white/8 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-semibold text-white">전체 곡 아카이브</div>
              <div className="text-xs text-gray-500">필터, 차트, 상세 목록</div>
            </div>
            <span className="text-gray-400 text-sm">{showArchive ? '접기 ▲' : '펼치기 ▼'}</span>
          </button>

          {showArchive && (
            <div className="space-y-6">
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
              <div className="bg-white/5 rounded-xl border border-secretary-gold/10 p-4">
                <SongList rankings={filtered} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-secretary-gold/10">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-secretary-gold">{value}</div>
    </div>
  );
}

function QuickCard({ to, icon, label, desc }: { to: string; icon: string; label: string; desc: string }) {
  return (
    <Link
      to={to}
      className="bg-white/5 rounded-xl p-4 border border-secretary-gold/10 hover:border-secretary-gold/30 hover:bg-white/8 transition-all group"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold text-white group-hover:text-secretary-gold transition-colors">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
    </Link>
  );
}
