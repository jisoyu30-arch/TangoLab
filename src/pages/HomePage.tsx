import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePracticeStore } from '../hooks/usePracticeStore';
import { useRecentItems } from '../hooks/useRecentItems';
import { computeRankings } from '../utils/tangoRanking';

import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';

import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];

export function HomePage() {
  const navigate = useNavigate();
  const { boards, compareSessions } = usePracticeStore();
  const { recentItems } = useRecentItems();

  // 검색
  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return songs
      .filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.orchestra?.toLowerCase().includes(q) ||
        s.vocalist?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery]);

  // 추천 후보곡 (결승 가중치 높은 TOP 5)
  const recommended = useMemo(() => {
    const rankings = computeRankings(songs, appearances);
    return rankings.slice(0, 5);
  }, []);

  // 최근 비교
  const recentCompares = useMemo(() => {
    return compareSessions.slice(0, 3);
  }, [compareSessions]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-5 space-y-6">

        {/* 1. 헤더 */}
        <div>
          <h1 className="text-xl font-bold text-secretary-gold">석정소유의 탱고랩</h1>
          <p className="text-sm text-gray-400 mt-1">대회곡 연구, 비교 연습, 전략 메모를 한곳에서</p>
        </div>

        {/* 2. 통합 검색 */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="곡, 악단, 보컬리스트 검색..."
            className="w-full bg-white/5 border border-secretary-gold/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-secretary-navy border border-secretary-gold/20 rounded-xl overflow-hidden z-20 shadow-xl max-h-[300px] overflow-y-auto">
              {searchResults.map(s => (
                <button
                  key={s.song_id}
                  onClick={() => { navigate(`/song/${s.song_id}`); setSearchQuery(''); }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center justify-between border-b border-white/5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white truncate">{s.title}</div>
                    <div className="text-xs text-gray-500 truncate">{s.orchestra} {s.vocalist ? `/ ${s.vocalist}` : ''}</div>
                  </div>
                  <span className="text-xs text-gray-600 ml-2">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. 빠른 진입 4개 */}
        <div className="grid grid-cols-2 gap-3">
          <QuickCard to="/songs" icon="🎵" label="대회곡" desc="출현 빈도 분석" />
          <QuickCard to="/orchestra" icon="🎻" label="악단 연구" desc="특징과 전략" />
          <QuickCard to="/compare" icon="🔍" label="비교 연습실" desc="레퍼런스 vs 우리" />
          <QuickCard to="/practice" icon="📋" label="연습 보드" desc="후보곡 관리" />
        </div>

        {/* 4. 오늘의 연습 보드 요약 */}
        {boards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300">연습 보드</h2>
              <Link to="/practice" className="text-xs text-secretary-gold hover:underline">전체 →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {boards.slice(0, 4).map(board => (
                <Link
                  key={board.id}
                  to={`/practice/${board.id}`}
                  className="flex-shrink-0 w-56 bg-white/5 border border-white/10 hover:border-secretary-gold/30 rounded-xl p-4 transition-all"
                >
                  <h3 className="text-sm font-semibold text-white truncate">{board.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{board.song_ids.length}곡</span>
                    <span>{board.notes?.length || 0}메모</span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1.5">
                    {new Date(board.updated_at).toLocaleDateString('ko-KR')}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. 최근 본 항목 */}
        {recentItems.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-300 mb-3">최근 본 항목</h2>
            <div className="space-y-1">
              {recentItems.slice(0, 5).map(item => (
                <Link
                  key={`${item.type}-${item.id}`}
                  to={item.type === 'song' ? `/song/${item.id}` : '/orchestra'}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/8 transition-colors"
                >
                  <span className="text-sm">{item.type === 'song' ? '🎵' : '🎻'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{item.title}</div>
                    {item.subtitle && <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>}
                  </div>
                  <span className="text-[10px] text-gray-600">
                    {new Date(item.visited_at).toLocaleDateString('ko-KR')}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 6. 최근 비교 */}
        {recentCompares.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300">최근 비교</h2>
              <Link to="/compare" className="text-xs text-secretary-gold hover:underline">전체 →</Link>
            </div>
            <div className="space-y-1">
              {recentCompares.map(session => {
                const done = session.checklist.filter(c => c.checked).length;
                return (
                  <Link
                    key={session.id}
                    to={`/compare/${session.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/8 transition-colors"
                  >
                    <span className="text-sm">🔍</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{session.title}</div>
                      <div className="text-xs text-gray-500">체크 {done}/{session.checklist.length}</div>
                    </div>
                    <span className="text-[10px] text-gray-600">
                      {new Date(session.updated_at).toLocaleDateString('ko-KR')}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. 추천 후보곡 (TOP 5) */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 mb-3">추천 후보곡</h2>
          <p className="text-xs text-gray-600 mb-2">대회 결승 가중치 기준 TOP 5</p>
          <div className="space-y-1">
            {recommended.map((r, i) => (
              <Link
                key={r.song_id}
                to={`/song/${r.song_id}`}
                className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-lg hover:bg-white/8 transition-colors"
              >
                <span className="text-xs text-gray-500 w-5 text-right font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{r.title}</div>
                  <div className="text-xs text-gray-500 truncate">{r.orchestra}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-secretary-gold">{r.total_appearances}회</span>
                  {r.final_count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">결 {r.final_count}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 하단 여백 (탭 네비 공간) */}
        <div className="h-4" />
      </div>
    </div>
  );
}

function QuickCard({ to, icon, label, desc }: { to: string; icon: string; label: string; desc: string }) {
  return (
    <Link
      to={to}
      className="bg-white/5 rounded-xl p-4 border border-secretary-gold/10 hover:border-secretary-gold/30 hover:bg-white/8 transition-all active:scale-[0.98]"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold text-white">{label}</div>
      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
    </Link>
  );
}
