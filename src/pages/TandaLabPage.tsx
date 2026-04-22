import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { TandaAnalysisSection } from '../components/TandaAnalysisSection';
import { TandaAIInsight } from '../components/TandaAIInsight';
import roundsData from '../data/competition_rounds.json';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import { extractYouTubeId, getCompetitionShortName } from '../utils/tangoHelpers';
import { classifyVideo, sortVideosByPriority, isPerformanceVideo } from '../utils/videoTypes';

import type { Song, Appearance } from '../types/tango';

interface RoundSong { song_id: string; title: string; orchestra: string; order: number; }
interface RoundVideo { video_id: string; url: string; channel: string; title: string; }
interface CompRound {
  round_id: string; competition: string; year: number; category: string;
  stage: string; ronda_number: number; songs: RoundSong[]; videos: RoundVideo[];
}

const allRounds = (roundsData as { rounds: CompRound[] }).rounds;
const songs = songsData as Song[];
const allAppearances = appearancesData as Appearance[];
const songMap = new Map(songs.map(s => [s.song_id, s]));

interface Tanda {
  id: string;
  competition: string;
  year: number;
  category: string;
  stage: string;
  ronda: number;
  songs: Array<{ song_id: string; title: string; orchestra: string; order: number }>;
  videoIds: string[];
  videos: RoundVideo[]; // 전체 영상 정보 (type 분류용)
  source: 'round' | 'appearance';
}

const STAGE_LABELS: Record<string, string> = { qualifying: '예선', semifinal: '준결승', final: '결승' };
const STAGE_COLORS: Record<string, string> = {
  final: 'bg-red-500/20 text-red-400',
  semifinal: 'bg-orange-500/20 text-orange-400',
  qualifying: 'bg-blue-500/20 text-blue-400',
};
const CAT_LABELS: Record<string, string> = {
  pista: '피스타', vals: '발스', milonga: '밀롱가', tango_de_pista: '피스타',
  pista_senior: '시니어', pista_newstar: '뉴스타',
  pista_singles_general: '싱글즈', pista_singles_newstar: '싱글즈 뉴스타',
  pista_singles_senior: '싱글즈 시니어',
};

function shortOrch(orchestra: string | null): string {
  if (!orchestra) return '?';
  const map: Record<string, string> = {
    'Juan': "D'Arienzo", 'Carlos': 'Di Sarli', 'Osvaldo': 'Pugliese',
    'Aníbal': 'Troilo', 'Ricardo': 'Tanturi', 'Miguel': 'Caló',
    'Rodolfo': 'Biagi', 'Edgardo': 'Donato', 'Pedro': 'Laurenz',
    'Alfredo': 'De Angelis', 'Francisco': 'Canaro', 'Lucio': 'Demare',
    'Angel': "D'Agostino", 'Enrique': 'Rodríguez',
  };
  const first = orchestra.split(' ')[0];
  return map[first] || first;
}

function buildAllTandas(): Tanda[] {
  const tandas: Tanda[] = [];

  for (const r of allRounds) {
    if (r.songs.length < 2) continue;
    // 퍼포먼스 영상 우선 정렬
    const sortedVids = sortVideosByPriority(r.videos || []);
    tandas.push({
      id: r.round_id,
      competition: r.competition,
      year: r.year,
      category: r.category,
      stage: r.stage,
      ronda: r.ronda_number,
      songs: r.songs,
      videoIds: sortedVids.map(v => v.video_id),
      videos: sortedVids,
      source: 'round',
    });
  }

  const roundSongSets = new Set(
    allRounds.filter(r => r.songs.length >= 2).map(r => {
      const key = r.songs.map(s => s.song_id).sort().join('|');
      return `${r.competition}-${r.year}-${key}`;
    })
  );

  const appGroups = new Map<string, Appearance[]>();
  for (const a of allAppearances) {
    const key = `${a.competition_id}-${a.year}-${a.stage}-${a.round_label || 'default'}`;
    if (!appGroups.has(key)) appGroups.set(key, []);
    appGroups.get(key)!.push(a);
  }

  for (const [, group] of appGroups) {
    if (group.length < 2) continue;
    const songIds = group.map(a => a.song_id).sort().join('|');
    const comp = getCompetitionShortName(group[0].competition_id);
    const dedupKey = `${comp}-${group[0].year}-${songIds}`;
    if (roundSongSets.has(dedupKey)) continue;

    const groupSongs = group
      .sort((a, b) => (a.song_order_in_round ?? 99) - (b.song_order_in_round ?? 99))
      .map((a, i) => {
        const s = songMap.get(a.song_id);
        return {
          song_id: a.song_id,
          title: s?.title || a.song_id,
          orchestra: s?.orchestra || '',
          order: a.song_order_in_round ?? (i + 1),
        };
      });

    const videoIds: string[] = [];
    for (const a of group) {
      const vid = extractYouTubeId(a.source_url);
      if (vid && !videoIds.includes(vid)) videoIds.push(vid);
    }

    tandas.push({
      id: `app-${group[0].competition_id}-${group[0].year}-${group[0].stage}-${group[0].round_label || 'default'}`,
      competition: comp,
      year: group[0].year,
      category: group[0].category,
      stage: group[0].stage,
      ronda: 0,
      songs: groupSongs,
      videoIds,
      videos: videoIds.map(id => ({ video_id: id, url: '', channel: '', title: '' })),
      source: 'appearance',
    });
  }

  const stageOrder: Record<string, number> = { final: 0, semifinal: 1, qualifying: 2 };
  tandas.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (stageOrder[a.stage] ?? 3) - (stageOrder[b.stage] ?? 3);
  });
  return tandas;
}

export function TandaLabPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [compFilter, setCompFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [expandedTandaId, setExpandedTandaId] = useState<string | null>(null);

  const tandas = useMemo(() => buildAllTandas(), []);

  const competitions = useMemo(() => {
    const set = new Set(tandas.map(t => t.competition));
    return Array.from(set).sort();
  }, [tandas]);

  const years = useMemo(() => {
    const set = new Set(tandas.map(t => t.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [tandas]);

  const coMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const t of tandas) {
      for (const s of t.songs) {
        if (!map[s.song_id]) map[s.song_id] = {};
        for (const other of t.songs) {
          if (other.song_id === s.song_id) continue;
          map[s.song_id][other.song_id] = (map[s.song_id][other.song_id] || 0) + 1;
        }
      }
    }
    return map;
  }, [tandas]);

  const companions = useMemo(() => {
    if (!selectedSongId || !coMap[selectedSongId]) return [];
    return Object.entries(coMap[selectedSongId])
      .map(([id, count]) => {
        const s = songMap.get(id);
        return { song_id: id, title: s?.title || id, orchestra: s?.orchestra || '', count };
      })
      .sort((a, b) => b.count - a.count);
  }, [selectedSongId, coMap]);

  const selectedTandas = useMemo(() => {
    if (!selectedSongId) return [];
    return tandas.filter(t => t.songs.some(s => s.song_id === selectedSongId));
  }, [selectedSongId, tandas]);

  const filtered = useMemo(() => {
    return tandas.filter(t => {
      if (stageFilter !== 'all' && t.stage !== stageFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (compFilter !== 'all' && t.competition !== compFilter) return false;
      if (yearFilter !== 'all' && t.year !== Number(yearFilter)) return false;
      if (searchQuery && !selectedSongId) {
        const q = searchQuery.toLowerCase();
        return t.songs.some(s => s.title.toLowerCase().includes(q) || s.orchestra.toLowerCase().includes(q));
      }
      return true;
    });
  }, [tandas, stageFilter, categoryFilter, compFilter, yearFilter, searchQuery, selectedSongId]);

  const searchCandidates = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2 || selectedSongId) return [];
    const q = searchQuery.toLowerCase();
    const songIds = new Set<string>();
    for (const t of tandas) for (const s of t.songs) songIds.add(s.song_id);
    return songs
      .filter(s => songIds.has(s.song_id) && (
        s.title.toLowerCase().includes(q) || (s.orchestra || '').toLowerCase().includes(q)
      ))
      .slice(0, 8);
  }, [searchQuery, tandas, selectedSongId]);

  const categories = useMemo(() => Array.from(new Set(tandas.map(t => t.category))), [tandas]);

  const orchStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tandas) {
      const orchs = [...new Set(t.songs.map(s => shortOrch(s.orchestra)))].sort().join(' + ');
      counts[orchs] = (counts[orchs] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [tandas]);

  return (
    <>
      <PageHeader title="탄다 연구소" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-tango-brass mb-1">탄다 연구소</h1>
            <p className="text-gray-400 text-sm">
              {tandas.length}개 탄다 · {competitions.join(', ')}
            </p>
          </div>

          {/* 오케스트라 조합 TOP */}
          <div className="bg-white/5 rounded-xl border border-tango-brass/10 p-4">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">악단 조합 TOP 10</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {orchStats.map(([combo, count]) => (
                <div key={combo} className="bg-white/5 rounded-lg p-2.5 text-center">
                  <div className="text-base font-bold text-tango-brass">{count}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{combo}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 📊 심층 분석 */}
          <TandaAnalysisSection tandas={tandas} />


          {/* 곡 검색 → 동반 곡 */}
          <div className="bg-white/5 rounded-xl border border-tango-brass/10 p-4">
            <h3 className="text-xs font-semibold text-tango-brass mb-3">곡으로 탄다 찾기</h3>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSelectedSongId(null); }}
                placeholder="곡명 또는 오케스트라..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-tango-brass/50"
              />
              {searchCandidates.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-tango-shadow border border-tango-brass/20 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                  {searchCandidates.map(s => (
                    <button
                      key={s.song_id}
                      onClick={() => { setSelectedSongId(s.song_id); setSearchQuery(s.title); }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <span className="text-white text-sm">{s.title}</span>
                      <span className="text-gray-500 text-xs ml-2">{shortOrch(s.orchestra)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSongId && (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Link to={`/song/${selectedSongId}`}
                    className="text-sm text-white font-medium hover:text-tango-brass transition-colors bg-white/5 px-3 py-2 rounded-lg min-h-[40px] flex items-center gap-2">
                    {songMap.get(selectedSongId)?.title}
                    <span className="text-gray-500">({shortOrch(songMap.get(selectedSongId)?.orchestra ?? '')})</span>
                    <span className="text-tango-brass">→</span>
                  </Link>
                  <span className="text-xs text-gray-500">{selectedTandas.length}개 탄다</span>
                  <button onClick={() => { setSelectedSongId(null); setSearchQuery(''); }}
                    className="text-xs text-gray-600 hover:text-gray-400 ml-auto px-2 py-1">초기화</button>
                </div>

                {companions.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-2">같이 나온 곡</div>
                    <div className="flex flex-wrap gap-1.5">
                      {companions.map(c => (
                        <Link
                          key={c.song_id}
                          to={`/song/${c.song_id}`}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 hover:text-white transition-colors"
                        >
                          {c.title}
                          <span className="text-gray-600">· {shortOrch(c.orchestra)}</span>
                          {c.count > 1 && <span className="text-tango-brass font-bold">{c.count}x</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {selectedTandas.map(t => (
                    <TandaCard key={t.id} tanda={t} highlightSongId={selectedSongId}
                      expanded={expandedTandaId === t.id} onToggle={() => setExpandedTandaId(expandedTandaId === t.id ? null : t.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 전체 탄다 목록 */}
          <div>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-gray-300">
                전체 탄다 ({filtered.length})
              </h3>
              <div className="flex gap-2 flex-wrap">
                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300">
                  <option value="all">전체 연도</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={compFilter} onChange={e => setCompFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300">
                  <option value="all">전체 대회</option>
                  {competitions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300">
                  <option value="all">전체 스테이지</option>
                  <option value="final">결승</option>
                  <option value="semifinal">준결승</option>
                  <option value="qualifying">예선</option>
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300">
                  <option value="all">전체 카테고리</option>
                  {categories.map(c => <option key={c} value={c}>{CAT_LABELS[c] || c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filtered.slice(0, 100).map(t => (
                <TandaCard key={t.id} tanda={t}
                  expanded={expandedTandaId === t.id} onToggle={() => setExpandedTandaId(expandedTandaId === t.id ? null : t.id)} />
              ))}
              {filtered.length > 100 && (
                <div className="text-center text-gray-500 text-xs py-3">
                  +{filtered.length - 100}개 더 · 필터로 좁혀보세요
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── 탄다 카드: 영상 플레이어 내장 ─── */

function TandaCard({
  tanda, highlightSongId, expanded, onToggle,
}: {
  tanda: Tanda; highlightSongId?: string;
  expanded: boolean; onToggle: () => void;
}) {
  const orchs = [...new Set(tanda.songs.map(s => shortOrch(s.orchestra)))].join(' + ');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  return (
    <div className={`rounded-xl overflow-hidden transition-all ${
      expanded ? 'border border-tango-brass/30 bg-white/[0.03]' : 'border border-white/10 bg-white/5 hover:border-white/20'
    }`}>
      {/* 헤더 */}
      <button onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left">
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className="text-white text-sm font-medium">{tanda.competition} {tanda.year}</span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${STAGE_COLORS[tanda.stage] || ''}`}>
            {STAGE_LABELS[tanda.stage] || tanda.stage}
          </span>
          {tanda.ronda > 0 && <span className="text-[11px] text-gray-500">{tanda.ronda}R</span>}
          <span className="text-[11px] text-gray-600">{CAT_LABELS[tanda.category] || tanda.category}</span>
          <span className="text-[11px] text-gray-600 hidden sm:inline">· {orchs}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {tanda.videoIds.length > 0 && (
            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">▶{tanda.videoIds.length}</span>
          )}
          <span className="text-gray-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* 곡 목록 (항상 표시) */}
      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        {tanda.songs.map((s, i) => (
          <Link
            key={s.song_id + '-' + i}
            to={`/song/${s.song_id}`}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
              highlightSongId === s.song_id
                ? 'bg-tango-brass/20 border-tango-brass/40 text-tango-brass'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-gray-600">{s.order}.</span>
            <span>{s.title}</span>
            <span className="text-gray-600 hidden sm:inline">· {shortOrch(s.orchestra)}</span>
          </Link>
        ))}
      </div>

      {/* 펼침: AI 해설 + 영상 */}
      {expanded && (
        <div className="border-t border-white/10 px-4 pt-2 pb-1">
          <TandaAIInsight
            competition={tanda.competition}
            year={tanda.year}
            stage={tanda.stage}
            ronda={tanda.ronda}
            songs={tanda.songs}
            cacheKey={tanda.id}
          />
        </div>
      )}
      {expanded && tanda.videoIds.length > 0 && (
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* 영상 플레이어 */}
          {playingVideo && (
            <div className="rounded-lg overflow-hidden border border-tango-brass/20">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`}
                  title="Competition video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
            </div>
          )}

          {/* 영상 목록 (퍼포먼스 우선) */}
          <div className="flex flex-wrap gap-2">
            {tanda.videos.map((v, i) => {
              const isPlaying = playingVideo === v.video_id;
              const type = classifyVideo(v);
              const isPerf = type === 'performance';
              return (
                <button
                  key={v.video_id}
                  onClick={() => setPlayingVideo(isPlaying ? null : v.video_id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm transition-all min-h-[40px] border ${
                    isPlaying
                      ? 'bg-tango-brass/20 text-tango-brass border-tango-brass/40'
                      : isPerf
                      ? 'bg-tango-brass/5 text-tango-paper hover:bg-tango-brass/15 border-tango-brass/30'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-transparent'
                  }`}
                >
                  <span>{isPlaying ? '⏸' : '▶'}</span>
                  <span className="text-xs">{isPerf ? '🎥 대회' : '🎵 음악'}</span>
                  <span className="text-[10px] text-tango-cream/60 truncate max-w-[200px]">
                    {v.channel || `영상 ${i + 1}`}
                  </span>
                </button>
              );
            })}
            {tanda.videos.filter(v => isPerformanceVideo(v)).length === 0 && tanda.videos.length > 0 && (
              <div className="text-[10px] text-tango-cream/40 italic px-2 py-1 self-center">
                ⚠ 실제 대회 영상이 없습니다
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
