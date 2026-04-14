import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import orchestrasData from '../data/orchestras.json';
import roundsData from '../data/competition_rounds.json';
import { extractYouTubeId, getCompetitionShortName, STAGE_LABELS } from '../utils/tangoHelpers';
import type { Song, Appearance, Orchestra } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const orchestras = orchestrasData as Orchestra[];

interface RoundSong { song_id: string; title: string; orchestra: string; order: number; }
interface RoundVideo { video_id: string; url: string; channel: string; title: string; }
interface CompRound {
  round_id: string; competition: string; year: number; category: string;
  stage: string; ronda_number: number; songs: RoundSong[]; videos: RoundVideo[];
}
const allRounds = (roundsData as { rounds: CompRound[] }).rounds;

const STYLE_TAG_LABELS: Record<string, string> = {
  rhythmic: '리듬', marcato: '마르카토', 'compás': '콤파스', energetic: '에너지',
  fast_tempo: '빠른 템포', elegant: '우아', melodic: '멜로디', lyrical: '서정',
  smooth: '부드러움', 'señorial': '세뇨리알', dramatic: '드라마틱', intense: '강렬',
  rhythmic_complex: '복잡한 리듬', rubato: '루바토', powerful: '파워풀',
  expressive: '표현적', vocal_focused: '보컬 중심', emotional: '감성적',
  clear_rhythm: '명확한 리듬', bandoneon_virtuoso: '반도네온 거장', balanced: '균형',
  nuanced: '뉘앙스', simple: '심플', accessible: '접근성', romantic: '로맨틱',
  staccato: '스타카토', refined: '세련', playful: '경쾌', milonga: '밀롱가',
  cheerful: '밝음', traditional: '전통', varied: '다양',
};

interface VideoEntry {
  videoId: string;
  competition: string;
  year: number;
  stage: string;
  source: 'round' | 'appearance';
}

interface SongDetail {
  song: Song;
  appearances: number;
  finalCount: number;
  semifinalCount: number;
  videos: VideoEntry[];
}

interface OrchestraStats {
  orchestra: Orchestra;
  totalAppearances: number;
  finalCount: number;
  semifinalCount: number;
  qualifyingCount: number;
  songCount: number;
  topSongs: SongDetail[];
  yearSpread: number[];
  competitions: string[];
}

function computeOrchestraStats(): OrchestraStats[] {
  const orchSongs = new Map<string, Song[]>();
  for (const s of songs) {
    if (!s.orchestra_id) continue;
    if (!orchSongs.has(s.orchestra_id)) orchSongs.set(s.orchestra_id, []);
    orchSongs.get(s.orchestra_id)!.push(s);
  }

  const songStats = new Map<string, { total: number; final: number; semifinal: number; qualifying: number }>();
  const songYears = new Map<string, Set<number>>();
  const songComps = new Map<string, Set<string>>();
  for (const a of appearances) {
    if (!songStats.has(a.song_id)) songStats.set(a.song_id, { total: 0, final: 0, semifinal: 0, qualifying: 0 });
    const s = songStats.get(a.song_id)!;
    s.total++;
    if (a.stage === 'final') s.final++;
    if (a.stage === 'semifinal') s.semifinal++;
    if (a.stage === 'qualifying') s.qualifying++;
    if (!songYears.has(a.song_id)) songYears.set(a.song_id, new Set());
    songYears.get(a.song_id)!.add(a.year);
    if (!songComps.has(a.song_id)) songComps.set(a.song_id, new Set());
    songComps.get(a.song_id)!.add(a.competition_id);
  }

  // 곡별 영상 수집 (rounds + appearances)
  function getVideosForSong(songId: string): VideoEntry[] {
    const seen = new Set<string>();
    const result: VideoEntry[] = [];

    // rounds
    for (const r of allRounds) {
      if (!r.songs.some(s => s.song_id === songId)) continue;
      for (const v of r.videos) {
        if (seen.has(v.video_id)) continue;
        seen.add(v.video_id);
        result.push({ videoId: v.video_id, competition: r.competition, year: r.year, stage: r.stage, source: 'round' });
      }
    }
    // appearances
    for (const a of appearances) {
      if (a.song_id !== songId) continue;
      const vid = extractYouTubeId(a.source_url);
      if (!vid || seen.has(vid)) continue;
      seen.add(vid);
      result.push({ videoId: vid, competition: getCompetitionShortName(a.competition_id), year: a.year, stage: a.stage, source: 'appearance' });
    }

    result.sort((a, b) => b.year - a.year);
    return result;
  }

  return orchestras.map(orch => {
    const mySongs = orchSongs.get(orch.orchestra_id) ?? [];
    let totalAppearances = 0, finalCount = 0, semifinalCount = 0, qualifyingCount = 0;
    const yearSet = new Set<number>();
    const compSet = new Set<string>();

    const songDetails: SongDetail[] = mySongs.map(song => {
      const stats = songStats.get(song.song_id) ?? { total: 0, final: 0, semifinal: 0, qualifying: 0 };
      totalAppearances += stats.total;
      finalCount += stats.final;
      semifinalCount += stats.semifinal;
      qualifyingCount += stats.qualifying;

      for (const y of songYears.get(song.song_id) ?? []) yearSet.add(y);
      for (const c of songComps.get(song.song_id) ?? []) compSet.add(getCompetitionShortName(c));

      return {
        song,
        appearances: stats.total,
        finalCount: stats.final,
        semifinalCount: stats.semifinal,
        videos: getVideosForSong(song.song_id),
      };
    });

    songDetails.sort((a, b) => b.appearances - a.appearances || b.finalCount - a.finalCount);

    return {
      orchestra: orch,
      totalAppearances, finalCount, semifinalCount, qualifyingCount,
      songCount: mySongs.length,
      topSongs: songDetails.filter(s => s.appearances > 0).slice(0, 15),
      yearSpread: Array.from(yearSet).sort(),
      competitions: Array.from(compSet).sort(),
    };
  }).sort((a, b) => b.totalAppearances - a.totalAppearances);
}

export function OrchestraAnalysisPage() {
  const stats = useMemo(() => computeOrchestraStats(), []);
  const [selectedOrchId, setSelectedOrchId] = useState<string | null>(null);

  const selected = useMemo(
    () => stats.find(s => s.orchestra.orchestra_id === selectedOrchId) ?? null,
    [stats, selectedOrchId],
  );
  const ranked = useMemo(() => stats.filter(s => s.totalAppearances > 0), [stats]);

  return (
    <>
      <header className="h-14 border-b border-secretary-gold/20 flex items-center px-5 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300">오케스트라 분석</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-secretary-gold mb-1">오케스트라 분석</h1>
            <p className="text-gray-400 text-sm">
              {ranked.length}개 오케스트라. 클릭하면 대회 출현 곡 순위 → 곡 클릭하면 영상 펼침
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ranked.map((os, i) => {
              const isSelected = selectedOrchId === os.orchestra.orchestra_id;
              const shortName = os.orchestra.alt_names[0] || os.orchestra.orchestra_name.split(' ')[0];
              const maxApp = ranked[0]?.totalAppearances || 1;
              const barWidth = Math.round((os.totalAppearances / maxApp) * 100);

              return (
                <button key={os.orchestra.orchestra_id}
                  onClick={() => setSelectedOrchId(isSelected ? null : os.orchestra.orchestra_id)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    isSelected ? 'border-secretary-gold/50 bg-secretary-gold/10' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-500">#{i + 1}</span>
                        <span className="text-white font-semibold text-sm">{shortName}</span>
                      </div>
                      {os.orchestra.active_era !== 'unknown' && <div className="text-[11px] text-gray-600 mt-0.5">{os.orchestra.active_era}</div>}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-secretary-gold">{os.totalAppearances}</div>
                      <div className="text-[10px] text-gray-500">출현</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-secretary-gold/60 rounded-full" style={{ width: `${barWidth}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-red-400">결 {os.finalCount}</span>
                    <span className="text-orange-400">준 {os.semifinalCount}</span>
                    <span className="text-blue-400">예 {os.qualifyingCount}</span>
                    <span className="text-gray-600 ml-auto">{os.songCount}곡</span>
                  </div>
                  {os.orchestra.style_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {os.orchestra.style_tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">
                          {STYLE_TAG_LABELS[tag] || tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {selected && <OrchestraDetail stats={selected} />}
        </div>
      </div>
    </>
  );
}

function OrchestraDetail({ stats }: { stats: OrchestraStats }) {
  const orch = stats.orchestra;
  const shortName = orch.alt_names[0] || orch.orchestra_name.split(' ')[0];
  const [expandedSong, setExpandedSong] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const total = stats.totalAppearances || 1;
  const finalPct = Math.round((stats.finalCount / total) * 100);
  const semiFinalPct = Math.round((stats.semifinalCount / total) * 100);
  const qualifyingPct = Math.round((stats.qualifyingCount / total) * 100);

  return (
    <div className="bg-white/5 rounded-xl border border-secretary-gold/10 overflow-hidden">
      {/* 헤더 */}
      <div className="p-5 border-b border-secretary-gold/10">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{shortName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{orch.orchestra_name}</p>
            {orch.active_era !== 'unknown' && <p className="text-xs text-gray-600 mt-1">활동기: {orch.active_era}</p>}
            {stats.competitions.length > 0 && (
              <p className="text-xs text-gray-600 mt-0.5">대회: {stats.competitions.join(', ')}</p>
            )}
          </div>
          <div className="bg-secretary-gold/20 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-bold text-secretary-gold">{stats.totalAppearances}</div>
            <div className="text-[10px] text-gray-400">총 출현</div>
          </div>
        </div>
        {orch.style_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {orch.style_tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secretary-gold/10 text-secretary-gold">
                {STYLE_TAG_LABELS[tag] || tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 전략 카드: 한 줄 정의 + 대표 특징 */}
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-xs font-semibold text-secretary-gold mb-3">춤 전략 요약</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {orch.style_tags.slice(0, 5).map(tag => (
            <div key={tag} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
              <span className="text-secretary-gold text-sm">•</span>
              <span className="text-sm text-gray-200">{STYLE_TAG_LABELS[tag] || tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 대회 사용 특성 */}
      {orch.common_competition_use_notes && !orch.common_competition_use_notes.includes('상세 정보 추가 필요') && (
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">대회 사용 특성</h3>
          <p className="text-sm text-gray-300 leading-relaxed">{orch.common_competition_use_notes}</p>
        </div>
      )}

      {/* 스테이지 분포 */}
      <div className="px-5 py-4 border-b border-white/5">
        <h3 className="text-xs font-semibold text-gray-400 mb-3">스테이지 분포</h3>
        <div className="grid grid-cols-3 gap-3">
          <StageBar label="결승" count={stats.finalCount} pct={finalPct} barClass="bg-red-500/60" />
          <StageBar label="준결승" count={stats.semifinalCount} pct={semiFinalPct} barClass="bg-orange-500/60" />
          <StageBar label="예선" count={stats.qualifyingCount} pct={qualifyingPct} barClass="bg-blue-500/60" />
        </div>
        {stats.yearSpread.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            <span>출현 연도:</span>
            {stats.yearSpread.map(y => (
              <span key={y} className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">{y}</span>
            ))}
          </div>
        )}
      </div>

      {/* 보컬리스트 */}
      {orch.key_vocalists.length > 0 && (
        <div className="px-5 py-4 border-b border-white/5">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">주요 보컬리스트</h3>
          <div className="flex flex-wrap gap-2">
            {orch.key_vocalists.map(v => (
              <span key={v} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300">{v}</span>
            ))}
          </div>
        </div>
      )}

      {/* 인라인 비디오 플레이어 */}
      {playingVideo && (
        <div className="mx-5 mt-4 rounded-lg overflow-hidden border border-secretary-gold/20">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`}
              title="Competition video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        </div>
      )}

      {/* TOP 곡 — 클릭하면 영상 펼침 */}
      {stats.topSongs.length > 0 && (
        <div className="px-5 py-4">
          <h3 className="text-xs font-semibold text-gray-400 mb-3">
            대회 출현 곡 TOP {stats.topSongs.length} <span className="text-gray-600 font-normal">· 클릭하면 영상</span>
          </h3>
          <div className="space-y-0.5">
            {stats.topSongs.map((sd, i) => {
              const isExpanded = expandedSong === sd.song.song_id;
              return (
                <div key={sd.song.song_id}>
                  <button
                    onClick={() => setExpandedSong(isExpanded ? null : sd.song.song_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      isExpanded ? 'bg-secretary-gold/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-gray-600 text-xs w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium truncate block ${isExpanded ? 'text-secretary-gold' : 'text-white'}`}>
                        {sd.song.title}
                      </span>
                      {sd.song.vocalist && <span className="text-[11px] text-gray-600">{sd.song.vocalist}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sd.videos.length > 0 && (
                        <span className="text-[10px] text-cyan-400">▶{sd.videos.length}</span>
                      )}
                      <span className="text-xs text-secretary-gold font-semibold">{sd.appearances}회</span>
                      {sd.finalCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">결 {sd.finalCount}</span>
                      )}
                      <span className="text-gray-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* 펼침: 영상 목록 + 곡 상세 링크 */}
                  {isExpanded && (
                    <div className="ml-8 mr-3 mb-2 mt-1 space-y-2">
                      <Link to={`/song/${sd.song.song_id}`}
                        className="inline-flex items-center gap-1 text-xs text-secretary-gold hover:underline">
                        곡 상세 페이지로 이동 ↗
                      </Link>

                      {sd.videos.length > 0 ? (
                        <div className="space-y-1">
                          {sd.videos.slice(0, 8).map(v => {
                            const stageLabel = STAGE_LABELS[v.stage] ?? v.stage;
                            const isPlaying = playingVideo === v.videoId;
                            return (
                              <div key={v.videoId} className="flex items-center gap-2">
                                <button
                                  onClick={() => setPlayingVideo(isPlaying ? null : v.videoId)}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 transition-colors ${
                                    isPlaying ? 'bg-secretary-gold text-secretary-dark' : 'bg-white/10 text-secretary-gold hover:bg-secretary-gold/20'
                                  }`}
                                >
                                  {isPlaying ? '⏸' : '▶'}
                                </button>
                                <span className="text-xs text-gray-300">{v.competition} {v.year}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                  v.stage === 'final' ? 'bg-red-500/20 text-red-400' :
                                  v.stage === 'semifinal' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>{stageLabel}</span>
                                <a href={`https://www.youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noopener noreferrer"
                                  className="text-gray-600 hover:text-secretary-gold text-xs ml-auto">↗</a>
                              </div>
                            );
                          })}
                          {sd.videos.length > 8 && (
                            <div className="text-[10px] text-gray-600 pl-9">+{sd.videos.length - 8}개 더</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600">영상 없음</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StageBar({ label, count, pct, barClass }: { label: string; count: number; pct: number; barClass: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-white font-medium">{count}회</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-gray-600 mt-0.5 text-right">{pct}%</div>
    </div>
  );
}
