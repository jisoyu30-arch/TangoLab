import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { useMemo, useState, useEffect } from 'react';
import { DanceAnalysis } from '../components/tango/DanceAnalysis';
import { TrainingStatusPanel } from '../components/tango/TrainingStatusPanel';
import { SongTrendChart } from '../components/tango/SongTrendChart';
import { usePracticeStore } from '../hooks/usePracticeStore';
import { getAppearancesForSong, getYearlyTrend, computeRankings } from '../utils/tangoRanking';
import { STAGE_LABELS, extractYouTubeId, getCompetitionShortName } from '../utils/tangoHelpers';
import { ShareButton } from '../components/ShareButton';
import { FavoriteButton } from '../components/FavoriteButton';
import { SongLifecycleTimeline } from '../components/SongLifecycleTimeline';
import { SongCooccurrenceNetwork } from '../components/SongCooccurrenceNetwork';
import { usePageMeta } from '../hooks/usePageMeta';
import { isPerformanceVideo, isMusicVideo } from '../utils/videoTypes';

import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import danceGuidesData from '../data/dance_guides.json';
import performanceData from '../data/performance_videos.json';
import roundsData from '../data/competition_rounds.json';

import type { Song, Appearance, DanceGuide } from '../types/tango';

interface RoundSong {
  song_id: string;
  title: string;
  orchestra: string;
  order: number;
}

interface RoundVideo {
  video_id: string;
  url: string;
  channel: string;
  title: string;
}

interface RoundRanking {
  rank: number;
  leader: string;
  follower: string;
  promedio: number;
}

interface CompetitionRound {
  round_id: string;
  competition: string;
  competition_id: string;
  year: number;
  category: string;
  stage: string;
  ronda_number: number;
  songs: RoundSong[];
  videos: RoundVideo[];
  rankings?: RoundRanking[];
}

const allRounds = (roundsData as { rounds: CompetitionRound[] }).rounds;

// video_id → channel 맵 (appearance의 source_url은 채널 정보가 없어서 rounds에서 조회)
const videoChannelMap = new Map<string, string>();
for (const r of allRounds) {
  for (const v of r.videos || []) {
    if (v.video_id && v.channel) videoChannelMap.set(v.video_id, v.channel);
  }
}

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const danceGuides = danceGuidesData as DanceGuide[];
const perfVideos = performanceData as unknown as Record<string, Array<{video_id: string; url: string; label: string; video_title: string; song_order?: number}>>;

interface VideoInfo {
  videoId: string;
  label: string;
  songOrder: number | null;
  year: number;
  competition: string;
  stage: string;
  roundLabel: string | null;
  channel?: string;
  isMusic?: boolean;
}

function pickBestVideos(
  songId: string,
  songAppearances: Appearance[],
  maxCount = 4
): { performance: VideoInfo[]; music: VideoInfo[] } {
  const performance: VideoInfo[] = [];
  const music: VideoInfo[] = [];
  const seenVideoIds = new Set<string>();

  const pushTo = (list: VideoInfo[], info: VideoInfo, limit = maxCount) => {
    if (list.length >= limit) return;
    if (seenVideoIds.has(info.videoId)) return;
    seenVideoIds.add(info.videoId);
    list.push(info);
  };

  // 1. perfVideos (명시된 퍼포먼스 영상) — 채널 교차 확인
  const perfVids = perfVideos[songId] ?? [];
  for (const pv of perfVids) {
    const ch = videoChannelMap.get(pv.video_id);
    const info: VideoInfo = {
      videoId: pv.video_id,
      label: pv.label,
      songOrder: pv.song_order ?? null,
      year: 0,
      competition: '',
      stage: '',
      roundLabel: null,
      channel: ch,
    };
    if (ch && isMusicVideo({ channel: ch })) {
      info.isMusic = true;
      pushTo(music, info, 3);
    } else {
      pushTo(performance, info);
    }
  }

  // 2. rounds에서 이 곡이 있는 라운드의 영상 — 퍼포먼스/음원 분기
  for (const r of allRounds) {
    if (!r.songs.some(s => s.song_id === songId)) continue;
    for (const v of (r.videos || [])) {
      const info: VideoInfo = {
        videoId: v.video_id,
        label: `${r.competition} ${r.year} ${STAGE_LABELS[r.stage] ?? r.stage}${r.ronda_number ? ` R${r.ronda_number}` : ''}`,
        songOrder: r.songs.find(s => s.song_id === songId)?.order ?? null,
        year: r.year,
        competition: r.competition,
        stage: STAGE_LABELS[r.stage] ?? r.stage,
        roundLabel: `R${r.ronda_number}`,
        channel: v.channel,
      };
      if (isPerformanceVideo(v)) {
        pushTo(performance, info);
      } else if (isMusicVideo(v)) {
        info.isMusic = true;
        pushTo(music, info, 3);
      }
    }
  }

  // 3. appearances — 퍼포먼스만 (부족 시 채움)
  if (performance.length < maxCount) {
    const priorityOrder = ['COMP-005', 'COMP-004', 'COMP-001', 'COMP-002', 'COMP-003'];
    const sorted = [...songAppearances].sort((a, b) => {
      const aPri = priorityOrder.indexOf(a.competition_id);
      const bPri = priorityOrder.indexOf(b.competition_id);
      const aP = aPri >= 0 ? aPri : 99;
      const bP = bPri >= 0 ? bPri : 99;
      if (aP !== bP) return aP - bP;
      return b.year - a.year;
    });

    for (const a of sorted) {
      if (performance.length >= maxCount) break;
      const vid = extractYouTubeId(a.source_url);
      if (!vid || seenVideoIds.has(vid)) continue;
      const ch = videoChannelMap.get(vid);
      // 음원 전용으로 알려진 영상은 스킵 (이미 music에 추가됨)
      if (ch && isMusicVideo({ channel: ch })) continue;
      // 채널 알 수 없으면 보수적으로 스킵 (확신 없는 영상 제외)
      if (!ch) continue;
      if (!isPerformanceVideo({ channel: ch })) continue;
      pushTo(performance, {
        videoId: vid,
        label: `${getCompetitionShortName(a.competition_id)} ${a.year} ${STAGE_LABELS[a.stage] ?? a.stage}${a.round_label ? ` ${a.round_label}` : ''}`,
        songOrder: a.song_order_in_round,
        year: a.year,
        competition: getCompetitionShortName(a.competition_id),
        stage: STAGE_LABELS[a.stage] ?? a.stage,
        roundLabel: a.round_label,
        channel: ch,
      });
    }
  }

  return { performance, music };
}


export function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showBoardPicker, setShowBoardPicker] = useState(false);
  const [savedToast, setSavedToast] = useState('');
  const { boards, addSongToBoard, addCompareSession } = usePracticeStore();

  const song = useMemo(() => songs.find(s => s.song_id === id), [id]);

  usePageMeta({
    title: song?.title,
    description: song ? `${song.orchestra || ''}${song.vocalist ? ' · ' + song.vocalist : ''}${song.recording_date ? ' · ' + song.recording_date + '년' : ''}` : undefined,
  });

  // 최근 본 항목 기록
  useEffect(() => {
    if (!song || !id) return;
    try {
      const KEY = 'tango_recent_items';
      const raw = localStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      const filtered = items.filter((i: { type: string; id: string }) => !(i.type === 'song' && i.id === id));
      filtered.unshift({ type: 'song', id, title: song.title, subtitle: song.orchestra, visited_at: new Date().toISOString() });
      localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, 20)));
    } catch { /* ignore */ }
  }, [id, song]);

  const handleSaveToBoard = (boardId: string) => {
    if (!id) return;
    addSongToBoard(boardId, id);
    const board = boards.find(b => b.id === boardId);
    setSavedToast(`"${board?.title}"에 저장됨`);
    setTimeout(() => setSavedToast(''), 2000);
    setShowBoardPicker(false);
  };

  const handleAddToCompare = () => {
    if (!id || !song) return;
    const sessionId = addCompareSession(song.title, id);
    navigate(`/compare/${sessionId}`);
  };
  const songAppearances = useMemo(() => id ? getAppearancesForSong(id, appearances) : [], [id]);
  const trend = useMemo(() => id ? getYearlyTrend(id, appearances) : [], [id]);
  const guide = useMemo(() => danceGuides.find(g => g.song_id === id), [id]);
  const rankings = useMemo(() => computeRankings(songs, appearances), []);
  const rank = useMemo(() => rankings.findIndex(r => r.song_id === id) + 1, [rankings, id]);
  const ranking = useMemo(() => rankings.find(r => r.song_id === id), [rankings, id]);

  const { performance: videos, music: musicRefs } = useMemo(
    () => id ? pickBestVideos(id, songAppearances, 2) : { performance: [], music: [] },
    [id, songAppearances]
  );

  // 이 곡이 사용된 모든 라운드 찾기
  const songRounds = useMemo(() => {
    if (!id) return [];
    return allRounds
      .filter(r => r.songs.some(s => s.song_id === id))
      .sort((a, b) => b.year - a.year || a.stage.localeCompare(b.stage));
  }, [id]);

  // 🎯 Mundial 전략 분석 — 결승 배치 포지션, 챔피언 선정률, 시대 트렌드
  const strategy = useMemo(() => {
    if (!id || songRounds.length === 0) return null;

    const finals = songRounds.filter(r => r.stage === 'final');
    const semifinals = songRounds.filter(r => r.stage === 'semifinal');
    const totalRounds = songRounds.length;

    // 결승에서의 배치 포지션 분포 (1/2/3/4번째 곡)
    const posCount: Record<number, number> = {};
    for (const r of finals) {
      const s = r.songs.find(x => x.song_id === id);
      if (s?.order) posCount[s.order] = (posCount[s.order] ?? 0) + 1;
    }
    const topPos = Object.entries(posCount).sort((a, b) => b[1] - a[1])[0];
    const preferredPosition = topPos ? Number(topPos[0]) : null;

    // 챔피언 (1위) 커플이 이 곡으로 춤춘 횟수
    let championUses = 0;
    for (const r of finals) {
      if (r.rankings?.some(rk => rk.rank === 1)) championUses++;
    }

    // 연도 분포
    const years = songRounds.map(r => r.year).sort();
    const yearSpan = years.length > 0 ? `${years[0]}-${years[years.length - 1]}` : '';
    const recentYears = years.filter(y => y >= 2022).length;
    const recentRate = totalRounds > 0 ? recentYears / totalRounds : 0;

    // 대회 다양성
    const competitions = new Set(songRounds.map(r => r.competition));

    // 전략 판정
    let verdict = '';
    let tier: 'gold' | 'silver' | 'bronze' | 'neutral' = 'neutral';
    if (finals.length >= 3 && championUses >= 1) {
      tier = 'gold';
      verdict = '결승 단골 + 우승자 선택곡. 실전 필수 레퍼런스.';
    } else if (finals.length >= 2) {
      tier = 'silver';
      verdict = '결승권 곡. 우리 탄다에 넣을 때 최종 3곡 후보로 고려.';
    } else if (semifinals.length >= 2) {
      tier = 'bronze';
      verdict = '준결승권. 예선~준결승 돌파용 탄다에 적합.';
    } else {
      verdict = '출현 빈도 낮음. 차별화 카드 또는 연습용으로.';
    }

    return {
      finalCount: finals.length,
      semiCount: semifinals.length,
      totalRounds,
      preferredPosition,
      posCount,
      championUses,
      yearSpan,
      recentRate,
      competitionCount: competitions.size,
      verdict,
      tier,
    };
  }, [id, songRounds]);

  if (!song) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎵</div>
          <p className="text-gray-400">곡을 찾을 수 없습니다.</p>
          <Link to="/" className="text-tango-brass text-sm hover:underline mt-2 inline-block">← 아카이브로 돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={song.title}
        autoMeta={false}
        onBack={() => navigate(-1)}
        right={
          <div className="flex items-center gap-2">
            <FavoriteButton type="song" id={song.song_id} title={song.title} size="sm" />
            <ShareButton title={`${song.title} · 탱고랩`} text={`${song.orchestra || ''}`} />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* 탭 네비게이션 — sticky */}
        <div className="sticky top-0 z-20 bg-tango-ink/95 backdrop-blur-sm border-b border-tango-brass/20">
          <div className="max-w-4xl mx-auto flex gap-0 overflow-x-auto">
            {[
              { anchor: 'overview', label: '개요' },
              { anchor: 'strategy', label: '전략' },
              { anchor: 'videos', label: '영상' },
              { anchor: 'timeline', label: '타임라인' },
              { anchor: 'network', label: '네트워크' },
              { anchor: 'history', label: '히스토리' },
            ].map(t => (
              <a
                key={t.anchor}
                href={`#${t.anchor}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(t.anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-4 py-3 text-sm font-serif italic whitespace-nowrap text-tango-cream/60 hover:text-tango-brass border-b-2 border-transparent hover:border-tango-brass/50 transition-all"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-5 space-y-6">
          {/* 곡 정보 헤더 */}
          <div id="overview"></div>
          <div className="bg-white/5 rounded-xl border border-tango-brass/10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">{song.title}</h1>
                {song.orchestra_id ? (
                  <Link to={`/orchestra?id=${song.orchestra_id}`} className="text-tango-brass text-sm hover:underline">
                    {song.orchestra ?? '오케스트라 미확인'} →
                  </Link>
                ) : (
                  <p className="text-tango-brass text-sm">{song.orchestra ?? '오케스트라 미확인'}</p>
                )}
              </div>
              {rank > 0 && (
                <div className="bg-tango-brass/20 rounded-xl px-4 py-2 text-center flex-shrink-0">
                  <div className="text-2xl font-bold text-tango-brass">#{rank}</div>
                  <div className="text-xs text-gray-400">전체 순위</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <InfoItem label="보컬" value={song.vocalist ?? '인스트루멘탈'} />
              <InfoItem label="녹음" value={song.recording_date ?? '미확인'} />
              <InfoItem label="장르" value={song.genre} />
              <InfoItem label="작곡" value={song.composer ?? '미확인'} />
              {ranking && (
                <>
                  <InfoItem label="총 출현" value={`${ranking.total_appearances}회`} highlight />
                  <InfoItem label="결승" value={`${ranking.final_count}회`} />
                  <InfoItem label="준결승" value={`${ranking.semifinal_count}회`} />
                  <InfoItem label="예선" value={`${ranking.qualifying_count}회`} />
                </>
              )}
            </div>

            {song.mood_tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {song.mood_tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-tango-brass/10 text-tango-brass text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
              <div className="relative">
                <button
                  onClick={() => setShowBoardPicker(!showBoardPicker)}
                  className="px-4 py-2 bg-tango-brass/20 text-tango-brass rounded-lg text-sm font-medium hover:bg-tango-brass/30 transition-colors min-h-[44px]"
                >
                  📋 연습 보드에 저장
                </button>
                {showBoardPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-tango-shadow border border-tango-brass/20 rounded-lg shadow-xl z-20 min-w-[200px]">
                    {boards.length > 0 ? boards.map(b => {
                      const alreadyAdded = id ? b.song_ids.includes(id) : false;
                      return (
                        <button
                          key={b.id}
                          onClick={() => !alreadyAdded && handleSaveToBoard(b.id)}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                            alreadyAdded ? 'text-gray-600 cursor-default' : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          <span>{b.title} <span className="text-gray-600">({b.song_ids.length}곡)</span></span>
                          {alreadyAdded && <span className="text-green-400 text-xs">✓ 추가됨</span>}
                        </button>
                      );
                    }) : (
                      <div className="px-4 py-3 text-xs text-gray-500">
                        보드가 없습니다.{' '}
                        <Link to="/practice" className="text-tango-brass hover:underline">만들기 →</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddToCompare}
                className="px-4 py-2 bg-white/10 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/15 transition-colors min-h-[44px]"
              >
                🔍 비교에 추가
              </button>
            </div>

            {/* 저장 토스트 */}
            {savedToast && (
              <div className="mt-2 text-xs text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
                {savedToast}
              </div>
            )}
          </div>

          <div id="strategy"></div>
          {/* 🎯 Mundial 전략 분석 — 데이터 기반 배치 전략 */}
          {strategy && (
            <div className={`rounded-sm border p-6 ${
              strategy.tier === 'gold' ? 'bg-gradient-to-br from-tango-brass/15 via-tango-shadow to-tango-ink border-tango-brass/40' :
              strategy.tier === 'silver' ? 'bg-gradient-to-br from-tango-brass/8 via-tango-shadow to-tango-ink border-tango-brass/25' :
              'bg-white/5 border-tango-brass/15'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
                    Mundial Strategy · 전략 분석
                  </div>
                  <h3 className="font-display italic text-2xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {strategy.tier === 'gold' ? '★ 결승 필수곡' :
                     strategy.tier === 'silver' ? '◆ 결승권 곡' :
                     strategy.tier === 'bronze' ? '◇ 준결승권 곡' : '○ 차별화 카드'}
                  </h3>
                </div>
                {strategy.championUses > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-tango-brass">🏆 {strategy.championUses}</div>
                    <div className="text-[10px] uppercase tracking-widest text-tango-cream/50">우승 탄다 사용</div>
                  </div>
                )}
              </div>

              <p className="text-tango-paper/90 font-serif italic text-base mb-5" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {strategy.verdict}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <StatCard label="결승 출현" value={`${strategy.finalCount}회`} accent={strategy.finalCount >= 2} />
                <StatCard label="준결승" value={`${strategy.semiCount}회`} />
                <StatCard label="대회 수" value={`${strategy.competitionCount}개`} />
                <StatCard label="활동 기간" value={strategy.yearSpan} />
              </div>

              {/* 결승 배치 포지션 분석 */}
              {strategy.finalCount > 0 && (
                <div className="mt-4 pt-4 border-t border-tango-brass/15">
                  <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-2">
                    결승 탄다 배치 포지션
                  </div>
                  <div className="flex items-end gap-2 h-16">
                    {[1, 2, 3, 4].map(pos => {
                      const count = strategy.posCount[pos] ?? 0;
                      const max = Math.max(...Object.values(strategy.posCount), 1);
                      const h = count > 0 ? (count / max) * 100 : 5;
                      const isPreferred = pos === strategy.preferredPosition;
                      return (
                        <div key={pos} className="flex-1 flex flex-col items-center gap-1">
                          <div className="text-[10px] text-tango-cream/60">{count > 0 ? count : ''}</div>
                          <div
                            className={`w-full rounded-sm transition-all ${
                              isPreferred ? 'bg-tango-brass' : count > 0 ? 'bg-tango-brass/40' : 'bg-white/5'
                            }`}
                            style={{ height: `${h}%` }}
                          />
                          <div className={`text-[10px] ${isPreferred ? 'text-tango-brass font-semibold' : 'text-tango-cream/40'}`}>
                            {pos}번
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {strategy.preferredPosition && (
                    <div className="text-xs text-tango-cream/70 mt-2 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      → 결승에서 주로 <span className="text-tango-brass font-semibold">{strategy.preferredPosition}번째 곡</span>으로 배치됨
                      {strategy.preferredPosition === 1 && ' (탄다 오프너 — 에너지 세팅)'}
                      {strategy.preferredPosition === 2 && ' (빌드업 — 드라이브 강화)'}
                      {strategy.preferredPosition === 3 && ' (클라이맥스 — 결정적 어필)'}
                      {strategy.preferredPosition === 4 && ' (클로저 — 인상 남기기)'}
                    </div>
                  )}
                </div>
              )}

              {/* 최근성 지표 */}
              {strategy.recentRate > 0 && (
                <div className="mt-3 text-xs text-tango-cream/60 font-sans">
                  최근 3년(2022~) 활용 비중:{' '}
                  <span className="text-tango-brass font-semibold">{Math.round(strategy.recentRate * 100)}%</span>
                  {strategy.recentRate >= 0.5 ? ' · 현재 트렌드' : strategy.recentRate >= 0.25 ? ' · 꾸준' : ' · 클래식'}
                </div>
              )}
            </div>
          )}

          {/* 전략 포인트 요약 (DanceGuide에서 추출) */}
          {guide && (
            <div className="bg-white/5 rounded-xl border border-tango-brass/10 p-5">
              <h3 className="text-sm font-semibold text-tango-brass mb-3">전략 포인트</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🎯</span>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">한 줄 요약</div>
                    <div className="text-sm text-gray-200">{guide.summary}</div>
                  </div>
                </div>
                {guide.competition_tip && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🏆</span>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">대회 팁</div>
                      <div className="text-sm text-gray-200">{guide.competition_tip}</div>
                    </div>
                  </div>
                )}
                {guide.partner_advice && (
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🤝</span>
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">파트너 어드바이스</div>
                      <div className="text-sm text-gray-200">{guide.partner_advice}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div id="videos"></div>
          {/* 🎥 대회 영상 (실제 커플 퍼포먼스) — 최대 2개 */}
          {videos.length > 0 && (
            <div className="space-y-4">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                🎥 대회 영상 · Competition Performance
              </div>
              {videos.map((v, i) => (
                <div key={v.videoId} className="bg-white/5 rounded-xl overflow-hidden border border-tango-brass/30">
                  <div className="px-4 py-2 border-b border-tango-brass/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-tango-brass text-xs font-semibold">영상 {i + 1}</span>
                      <span className="text-gray-300 text-xs">{v.label}</span>
                      {v.channel && (
                        <span className="text-[10px] text-tango-cream/50">· {v.channel}</span>
                      )}
                    </div>
                    {v.songOrder && (
                      <span className="text-xs bg-tango-brass/20 text-tango-brass px-2 py-0.5 rounded-full">
                        이 영상에서 {v.songOrder}번째 곡
                      </span>
                    )}
                  </div>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${v.videoId}`}
                      title={`${song.title} - ${v.label}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 대회 영상 없음 안내 */}
          {videos.length === 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-orange-400 font-sans mb-2">
                ⚠ 대회 영상 미확보
              </div>
              <p className="text-sm text-tango-paper/80 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                이 곡의 실제 커플 퍼포먼스 영상을 아직 찾지 못했습니다.
                {musicRefs.length > 0 && ' 아래 음원 참고 영상으로 곡을 먼저 익히세요.'}
              </p>
            </div>
          )}

          {/* 🎵 음원 참고 — 춤 없는 플레이리스트/음원 모음 (명확히 분리) */}
          {musicRefs.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-cream/60 font-sans">
                🎵 음원 참고 · Music Reference (퍼포먼스 없음)
              </div>
              <div className="bg-white/3 border border-white/10 rounded-xl p-3 text-[11px] text-tango-cream/60 font-sans">
                ⓘ 춤 영상이 아닌 <strong>음원·플레이리스트</strong>입니다. 대회 참고가 아닌 곡 학습용.
              </div>
              <div className="space-y-3">
                {musicRefs.map((v, i) => (
                  <details key={v.videoId} className="bg-white/3 rounded-xl border border-white/10 overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-white/5 flex items-center justify-between text-sm text-tango-cream/70">
                      <div className="flex items-center gap-2">
                        <span className="text-tango-cream/40">🎵</span>
                        <span>음원 {i + 1}</span>
                        <span className="text-xs">· {v.label}</span>
                        {v.channel && <span className="text-[10px] text-tango-cream/40">· {v.channel}</span>}
                      </div>
                      <span className="text-tango-cream/40 text-xs">▸ 펼쳐서 재생</span>
                    </summary>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${v.videoId}`}
                        title={`${song.title} - ${v.label} (music)`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* 훈련 상태 */}
          <TrainingStatusPanel songId={song.song_id} />

          {/* 춤 분석 */}
          <DanceAnalysis guide={guide} />

          <div id="timeline"></div>
          {/* 라이프사이클 타임라인 (대회 출현 점 그래프) */}
          <SongLifecycleTimeline appearances={songAppearances} />

          <div id="network"></div>
          {/* 공출현 네트워크 (이 곡과 자주 묶이는 곡들) */}
          {id && <SongCooccurrenceNetwork focusSongId={id} />}

          {/* 연도별 추이 */}
          <SongTrendChart data={trend} />

          <div id="history"></div>
          {/* 곡별 대회 히스토리 — 론다 단위 */}
          <div className="bg-white/5 rounded-xl border border-tango-brass/10 p-5">
            <h3 className="text-sm font-semibold text-tango-brass mb-4">대회 히스토리</h3>
            {songRounds.length > 0 ? (
              <div className="space-y-4">
                {songRounds.map(round => {
                  const CATEGORY_LABELS: Record<string, string> = {
                    pista: '피스타', vals: '발스', milonga: '밀롱가',
                    pista_senior: '시니어 피스타', vals_senior: '시니어 발스',
                    pista_newstar: '뉴스타 피스타', pista_singles_newstar: '싱글즈 뉴스타',
                    pista_singles_general: '싱글즈', pista_singles_senior: '싱글즈 시니어',
                  };
                  const stageLabel = STAGE_LABELS[round.stage] ?? round.stage;
                  const catLabel = CATEGORY_LABELS[round.category] ?? round.category;
                  const otherSongs = round.songs.filter(s => s.song_id !== id);
                  const thisSong = round.songs.find(s => s.song_id === id);

                  return (
                    <div key={round.round_id} className="border border-white/10 rounded-lg overflow-hidden">
                      {/* 라운드 헤더 */}
                      <div className="bg-white/5 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium text-sm">
                            {round.competition} {round.year}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-tango-brass/20 text-tango-brass">
                            {catLabel}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            round.stage === 'final' ? 'bg-red-500/20 text-red-400' :
                            round.stage === 'semifinal' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {stageLabel}
                          </span>
                          {round.ronda_number > 0 && (
                            <span className="text-xs text-gray-500">
                              {round.ronda_number}R
                            </span>
                          )}
                        </div>
                        {thisSong && (
                          <span className="text-xs text-gray-400">
                            {thisSong.order}번째 곡
                          </span>
                        )}
                      </div>

                      <div className="px-4 py-3 space-y-3">
                        {/* 같은 론다의 다른 곡 */}
                        {otherSongs.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1.5">같은 론다 곡</div>
                            <div className="flex flex-wrap gap-1.5">
                              {otherSongs.map(s => (
                                <Link
                                  key={s.song_id}
                                  to={`/song/${s.song_id}`}
                                  className="text-xs px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
                                >
                                  {s.title} <span className="text-gray-500">· {(s.orchestra ?? '').split(' ').slice(0, 2).join(' ') || '미확인'}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 영상 링크 */}
                        {round.videos.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {round.videos.map(v => (
                              <a
                                key={v.video_id}
                                href={v.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-tango-brass/10 hover:bg-tango-brass/20 text-tango-brass rounded-lg transition-colors"
                              >
                                <span>▶</span>
                                <span>{v.channel}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* 상위 댄서 (문디알 결승만) */}
                        {round.rankings && round.rankings.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-1.5">결승 순위</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {round.rankings.slice(0, 5).map(r => (
                                <div key={r.rank} className="flex items-center gap-2 text-xs">
                                  <span className={`w-5 text-center font-bold ${
                                    r.rank === 1 ? 'text-yellow-400' :
                                    r.rank === 2 ? 'text-gray-300' :
                                    r.rank === 3 ? 'text-amber-600' :
                                    'text-gray-500'
                                  }`}>
                                    {r.rank}
                                  </span>
                                  <span className="text-gray-300">{r.leader} & {r.follower}</span>
                                  <span className="text-gray-500 ml-auto">{r.promedio.toFixed(3)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : songAppearances.length > 0 ? (
              /* 기존 appearances 데이터 폴백 */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-tango-brass/10">
                      <th className="py-2 px-2">연도</th>
                      <th className="py-2 px-2">대회</th>
                      <th className="py-2 px-2">스테이지</th>
                      <th className="py-2 px-2">영상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {songAppearances.map(a => {
                      const vid = extractYouTubeId(a.source_url);
                      return (
                        <tr key={a.appearance_id} className="border-b border-white/5">
                          <td className="py-2 px-2 text-white">{a.year}</td>
                          <td className="py-2 px-2 text-gray-300">{getCompetitionShortName(a.competition_id)}</td>
                          <td className="py-2 px-2 text-gray-300">{STAGE_LABELS[a.stage] ?? a.stage}</td>
                          <td className="py-2 px-2">
                            {vid ? (
                              <a href={`https://www.youtube.com/watch?v=${vid}`} target="_blank" rel="noopener noreferrer"
                                className="text-tango-brass hover:underline text-xs">▶ 보기</a>
                            ) : <span className="text-gray-600 text-xs">-</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">대회 히스토리가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-sm border p-3 ${accent ? 'border-tango-brass/40 bg-tango-brass/5' : 'border-tango-brass/15 bg-white/5'}`}>
      <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-1">{label}</div>
      <div className={`font-display text-xl ${accent ? 'text-tango-brass' : 'text-tango-paper'}`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {value}
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`font-medium ${highlight ? 'text-tango-brass' : 'text-gray-200'}`}>{value}</div>
    </div>
  );
}
