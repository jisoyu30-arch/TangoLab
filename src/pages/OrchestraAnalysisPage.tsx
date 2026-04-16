import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import orchestrasData from '../data/orchestras.json';
import roundsData from '../data/competition_rounds.json';
import danceGuidesData from '../data/dance_guides.json';
import { extractYouTubeId, getCompetitionShortName, STAGE_LABELS } from '../utils/tangoHelpers';
import type { Song, Appearance, Orchestra, DanceGuide } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const orchestras = orchestrasData as Orchestra[];
const danceGuides = danceGuidesData as DanceGuide[];

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
  songOrder: number | null;
}

interface SongDetail {
  song: Song;
  appearances: number;
  finalCount: number;
  semifinalCount: number;
  videos: VideoEntry[];
  guide: DanceGuide | null;
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

  function getVideosForSong(songId: string): VideoEntry[] {
    const seen = new Set<string>();
    const result: VideoEntry[] = [];
    for (const r of allRounds) {
      const matchedSong = r.songs.find(s => s.song_id === songId);
      if (!matchedSong) continue;
      for (const v of r.videos) {
        if (seen.has(v.video_id)) continue;
        seen.add(v.video_id);
        result.push({ videoId: v.video_id, competition: r.competition, year: r.year, stage: r.stage, source: 'round', songOrder: matchedSong.order ?? null });
      }
    }
    for (const a of appearances) {
      if (a.song_id !== songId) continue;
      const vid = extractYouTubeId(a.source_url);
      if (!vid || seen.has(vid)) continue;
      seen.add(vid);
      result.push({ videoId: vid, competition: getCompetitionShortName(a.competition_id), year: a.year, stage: a.stage, source: 'appearance', songOrder: a.song_order_in_round ?? null });
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
        guide: danceGuides.find(g => g.song_id === song.song_id) ?? null,
      };
    });

    songDetails.sort((a, b) => b.appearances - a.appearances || b.finalCount - a.finalCount);

    return {
      orchestra: orch,
      totalAppearances, finalCount, semifinalCount, qualifyingCount,
      songCount: mySongs.length,
      topSongs: songDetails.filter(s => s.appearances > 0).slice(0, 20),
      yearSpread: Array.from(yearSet).sort(),
      competitions: Array.from(compSet).sort(),
    };
  }).sort((a, b) => b.totalAppearances - a.totalAppearances);
}

export function OrchestraAnalysisPage() {
  const stats = useMemo(() => computeOrchestraStats(), []);
  const [searchParams] = useSearchParams();
  const [selectedOrchId, setSelectedOrchId] = useState<string | null>(searchParams.get('id'));

  // URL 파라미터로 악단 자동 선택 (곡 상세 → 악단 링크)
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) setSelectedOrchId(idParam);
  }, [searchParams]);

  const selected = useMemo(
    () => stats.find(s => s.orchestra.orchestra_id === selectedOrchId) ?? null,
    [stats, selectedOrchId],
  );
  const [orchSearch, setOrchSearch] = useState('');
  const ranked = useMemo(() => {
    const all = stats.filter(s => s.totalAppearances > 0);
    if (!orchSearch.trim()) return all;
    const q = orchSearch.toLowerCase();
    return all.filter(s =>
      s.orchestra.orchestra_name.toLowerCase().includes(q) ||
      s.orchestra.alt_names.some(n => n.toLowerCase().includes(q))
    );
  }, [stats, orchSearch]);

  return (
    <>
      <PageHeader title="악단 연구" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5 space-y-5">

          {/* 악단 선택 그리드 */}
          {!selected ? (
            <>
              <div>
                <h1 className="text-xl font-bold text-secretary-gold mb-1">악단 연구</h1>
                <p className="text-gray-400 text-sm">악단을 선택하면 대회 출현곡과 영상을 볼 수 있습니다</p>
              </div>
              <input
                type="text"
                value={orchSearch}
                onChange={e => setOrchSearch(e.target.value)}
                placeholder="악단 이름 검색..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ranked.map((os, i) => {
                  const shortName = os.orchestra.alt_names[0] || os.orchestra.orchestra_name.split(' ')[0];
                  const maxApp = ranked[0]?.totalAppearances || 1;
                  const barWidth = Math.round((os.totalAppearances / maxApp) * 100);

                  return (
                    <button key={os.orchestra.orchestra_id}
                      onClick={() => setSelectedOrchId(os.orchestra.orchestra_id)}
                      className="text-left rounded-xl border border-white/10 bg-white/5 hover:border-secretary-gold/40 hover:bg-white/[0.07] p-4 transition-all active:scale-[0.98]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-500">#{i + 1}</span>
                          <span className="text-white font-semibold">{shortName}</span>
                        </div>
                        <span className="text-lg font-bold text-secretary-gold">{os.totalAppearances}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-secretary-gold/60 rounded-full" style={{ width: `${barWidth}%` }} />
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-red-400">결 {os.finalCount}</span>
                        <span className="text-orange-400">준 {os.semifinalCount}</span>
                        <span className="text-blue-400">예 {os.qualifyingCount}</span>
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
            </>
          ) : (
            /* 악단 상세 — 곡 목록 중심 */
            <OrchestraDetail stats={selected} onBack={() => setSelectedOrchId(null)} />
          )}
        </div>
      </div>
    </>
  );
}

/* ───────── 악단 상세: 곡 목록이 주인공 ───────── */

function OrchestraDetail({ stats, onBack }: { stats: OrchestraStats; onBack: () => void }) {
  const orch = stats.orchestra;
  const shortName = orch.alt_names[0] || orch.orchestra_name.split(' ')[0];
  const [expandedSong, setExpandedSong] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-4">

      {/* 헤더: 뒤로가기 + 악단 이름 + 요약 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-secretary-gold text-sm transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{shortName}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span>{stats.totalAppearances}회 출현</span>
            <span className="text-red-400">결 {stats.finalCount}</span>
            <span className="text-orange-400">준 {stats.semifinalCount}</span>
            {orch.active_era !== 'unknown' && <span>{orch.active_era}</span>}
          </div>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-xs text-gray-500 hover:text-secretary-gold px-3 py-2 bg-white/5 rounded-lg transition-colors min-h-[40px]"
        >
          {showInfo ? '정보 닫기' : '악단 정보'}
        </button>
      </div>

      {/* 스타일 태그 */}
      {orch.style_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {orch.style_tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secretary-gold/10 text-secretary-gold">
              {STYLE_TAG_LABELS[tag] || tag}
            </span>
          ))}
        </div>
      )}

      {/* 접을 수 있는 악단 상세 정보 */}
      {showInfo && (
        <div className="bg-white/5 rounded-xl border border-secretary-gold/10 p-4 space-y-3">
          {orch.common_competition_use_notes && !orch.common_competition_use_notes.includes('상세 정보 추가 필요') && (
            <div>
              <div className="text-xs text-gray-400 mb-1">대회 사용 특성</div>
              <p className="text-sm text-gray-300 leading-relaxed">{orch.common_competition_use_notes}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <StageBar label="결승" count={stats.finalCount} pct={Math.round((stats.finalCount / (stats.totalAppearances || 1)) * 100)} barClass="bg-red-500/60" />
            <StageBar label="준결승" count={stats.semifinalCount} pct={Math.round((stats.semifinalCount / (stats.totalAppearances || 1)) * 100)} barClass="bg-orange-500/60" />
            <StageBar label="예선" count={stats.qualifyingCount} pct={Math.round((stats.qualifyingCount / (stats.totalAppearances || 1)) * 100)} barClass="bg-blue-500/60" />
          </div>
          {orch.key_vocalists.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">보컬리스트</div>
              <div className="flex flex-wrap gap-1.5">
                {orch.key_vocalists.map(v => (
                  <span key={v} className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-gray-300">{v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ★ 곡 목록 — 메인 콘텐츠 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          대회 출현곡 ({stats.topSongs.length})
        </h2>
        <div className="space-y-1">
          {stats.topSongs.map((sd, i) => {
            const isExpanded = expandedSong === sd.song.song_id;
            return (
              <div key={sd.song.song_id}>
                {/* 곡 행 */}
                <button
                  onClick={() => {
                    setExpandedSong(isExpanded ? null : sd.song.song_id);
                    setPlayingVideo(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    isExpanded
                      ? 'bg-secretary-gold/10 border border-secretary-gold/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/8'
                  }`}
                >
                  <span className="text-gray-600 text-xs w-5 text-right font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isExpanded ? 'text-secretary-gold' : 'text-white'}`}>
                      {sd.song.title}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {sd.song.vocalist || '인스트루멘탈'}
                      {sd.song.recording_date && ` · ${sd.song.recording_date}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {sd.videos.length > 0 && (
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full">▶{sd.videos.length}</span>
                    )}
                    <span className="text-xs font-semibold text-secretary-gold">{sd.appearances}회</span>
                    {sd.finalCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">결{sd.finalCount}</span>
                    )}
                  </div>
                </button>

                {/* 펼침: 영상 + 분석 + 상세 링크 */}
                {isExpanded && (
                  <div className="mt-1 mb-2 bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">

                    {/* 영상 플레이어 (곡 바로 아래) */}
                    {playingVideo && (
                      <div className="border-b border-white/10">
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <iframe className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`}
                            title={sd.song.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen />
                        </div>
                      </div>
                    )}

                    <div className="p-4 space-y-4">

                      {/* 대회 출전 영상 */}
                      {sd.videos.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-400 mb-2">대회 출전 영상</div>
                          <div className="space-y-1.5">
                            {sd.videos.slice(0, 6).map(v => {
                              const stageLabel = STAGE_LABELS[v.stage] ?? v.stage;
                              const isPlaying = playingVideo === v.videoId;
                              return (
                                <button
                                  key={v.videoId}
                                  onClick={() => setPlayingVideo(isPlaying ? null : v.videoId)}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                                    isPlaying
                                      ? 'bg-secretary-gold/20 border border-secretary-gold/30'
                                      : 'bg-white/5 hover:bg-white/8 border border-transparent'
                                  }`}
                                >
                                  <span className={`text-sm ${isPlaying ? 'text-secretary-gold' : 'text-gray-500'}`}>
                                    {isPlaying ? '⏸' : '▶'}
                                  </span>
                                  <span className="text-sm text-gray-200 flex-1">
                                    {v.competition} {v.year}
                                    {v.songOrder && (
                                      <span className="text-[10px] text-gray-500 ml-1.5">{v.songOrder}번째 곡</span>
                                    )}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    v.stage === 'final' ? 'bg-red-500/20 text-red-400' :
                                    v.stage === 'semifinal' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-blue-500/20 text-blue-400'
                                  }`}>{stageLabel}</span>
                                </button>
                              );
                            })}
                            {sd.videos.length > 6 && (
                              <div className="text-[10px] text-gray-600 px-3">+{sd.videos.length - 6}개 더</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 곡 분석 요약 (DanceGuide) */}
                      {sd.guide && (
                        <div>
                          <div className="text-xs text-gray-400 mb-2">곡 분석</div>
                          <div className="space-y-2">
                            <div className="bg-white/5 rounded-lg px-3 py-2">
                              <span className="text-secretary-gold text-xs mr-2">요약</span>
                              <span className="text-sm text-gray-200">{sd.guide.summary}</span>
                            </div>
                            {sd.guide.competition_tip && (
                              <div className="bg-white/5 rounded-lg px-3 py-2">
                                <span className="text-red-400 text-xs mr-2">대회 팁</span>
                                <span className="text-sm text-gray-200">{sd.guide.competition_tip}</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {sd.guide.recommended_moves.slice(0, 4).map(m => (
                                <span key={m} className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full">{m}</span>
                              ))}
                              {sd.guide.avoid_moves.slice(0, 2).map(m => (
                                <span key={m} className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full line-through">{m}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 무드 태그 */}
                      {sd.song.mood_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {sd.song.mood_tags.map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-secretary-gold/10 text-secretary-gold rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* 곡 상세 페이지 이동 버튼 */}
                      <Link
                        to={`/song/${sd.song.song_id}`}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-secretary-gold/10 hover:bg-secretary-gold/20 text-secretary-gold rounded-xl text-sm font-medium transition-colors min-h-[48px]"
                      >
                        곡 상세 보기 →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
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
