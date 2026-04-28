// 소유 & 석정 부부 Command Center — 전략 대시보드
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { TaggedVideoPlayer } from '../components/TaggedVideoPlayer';
import type { VideoSong, VideoParticipant } from '../components/TaggedVideoPlayer';
import ktcData from '../data/ktc_participants.json';
import roundsData from '../data/competition_rounds.json';

// 우리 대회 영상 매핑 (key = year-category-stage)
const MY_VIDEOS: Record<string, { id: string; label: string; group?: string }> = {
  '2023-milonga-final': { id: 'GbiiDONSSWI', label: '🏆 2023 Milonga 결승 6위', group: 'Final' },
  '2023-milonga-semifinal': { id: 'zyMNqg4N0XU', label: '2023 Milonga 준결승 A조 R1 · 9위', group: 'A조 R1' },
  '2023-pista_singles_jackandjill-semifinal': { id: 'Hl1FSNIlY1w', label: '2023 Jack 준결승 B조 R2 · 22위 (석정)', group: 'B조 R2' },
  '2024-pista-semifinal': { id: 'rbdGrbJwHi0', label: '2024 Pista 준결승 R2 · 30위', group: 'R2' },
  '2024-pista_singles_jackandjill-semifinal': { id: 'KsI2EgUno5s', label: '2024 Jack 준결승 R2 · 20위 (석정)', group: 'R2' },
};

// 데이터 타입
interface MyRecord {
  event_key: string;
  year: number;
  competition: string;
  category: string;
  stage: string;
  rank: number;
  total_participants?: number;
  advanced?: boolean;
  scores: number[];
  judges: string[];
  avg: number;
  total?: number;
  is_solo?: boolean; // Jack은 석정 단독
}

interface JudgeStat {
  name: string;
  samples: Array<{ score: number; event: string; year: number }>;
  avg: number;
  min: number;
  max: number;
}

export function CoupleCommandCenterPage() {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const myData = useMemo(() => {
    const records: MyRecord[] = [];
    const data = ktcData as any;
    for (const [key, ev] of Object.entries(data.events)) {
      const e = ev as any;
      for (const c of e.couples || []) {
        if (c.is_my_couple || c.is_my_partner) {
          records.push({
            event_key: key,
            year: e.year,
            competition: e.competition,
            category: e.category,
            stage: e.stage,
            rank: c.rank,
            total_participants: e.analysis?.total || e.analysis?.total_participants || e.analysis?.total_semifinalists,
            advanced: c.advanced,
            scores: c.scores,
            judges: e.judges,
            avg: c.average,
            total: c.total,
            is_solo: c.is_my_partner && !c.is_my_couple,
          });
        }
      }
    }
    return records.sort((a, b) => a.year - b.year || a.event_key.localeCompare(b.event_key));
  }, []);

  // 심사위원별 집계
  const judgeStats = useMemo(() => {
    const map: Record<string, JudgeStat> = {};
    for (const r of myData) {
      r.judges.forEach((j, i) => {
        const s = r.scores[i];
        if (s === undefined) return;
        if (!map[j]) map[j] = { name: j, samples: [], avg: 0, min: 10, max: 0 };
        map[j].samples.push({ score: s, event: r.event_key, year: r.year });
      });
    }
    const arr = Object.values(map);
    for (const j of arr) {
      const sum = j.samples.reduce((a, b) => a + b.score, 0);
      j.avg = sum / j.samples.length;
      j.min = Math.min(...j.samples.map(s => s.score));
      j.max = Math.max(...j.samples.map(s => s.score));
    }
    return arr.sort((a, b) => b.avg - a.avg);
  }, [myData]);

  // 부문별 집계
  const categoryStats = useMemo(() => {
    const map: Record<string, { records: MyRecord[]; totalAvg: number; bestRank: number; advanceRate: number }> = {};
    for (const r of myData) {
      const cat = r.category === 'pista_singles_jackandjill' ? 'jack_solo' : r.category;
      if (!map[cat]) map[cat] = { records: [], totalAvg: 0, bestRank: 999, advanceRate: 0 };
      map[cat].records.push(r);
    }
    for (const c of Object.values(map)) {
      c.totalAvg = c.records.reduce((a, b) => a + b.avg, 0) / c.records.length;
      c.bestRank = Math.min(...c.records.map(r => r.rank));
      c.advanceRate = c.records.filter(r => r.advanced).length / c.records.length;
    }
    return map;
  }, [myData]);

  // 전략 인사이트 자동 생성
  const insights = useMemo(() => {
    const out: Array<{ level: 'strength' | 'opportunity' | 'warning'; title: string; detail: string }> = [];

    // 1. 가장 관대한 심사
    if (judgeStats.length > 0) {
      const top = judgeStats[0];
      if (top.samples.length >= 2 && top.avg >= 8.5) {
        out.push({
          level: 'strength',
          title: `${top.name} 심사가 최대 강점`,
          detail: `평균 ${top.avg.toFixed(2)} · ${top.samples.length}회 심사 · 최고 ${top.max}점. 이 심사위원 스타일에 계속 투자.`,
        });
      }
    }

    // 2. 가장 까다로운 심사
    if (judgeStats.length >= 2) {
      const bottom = judgeStats[judgeStats.length - 1];
      if (bottom.samples.length >= 2 && bottom.avg < 8.1) {
        out.push({
          level: 'warning',
          title: `${bottom.name} 기준에서 약점`,
          detail: `평균 ${bottom.avg.toFixed(2)} · ${bottom.samples.length}회. 이 심사위원의 평가 포인트 보강이 다음 대회 핵심 레버리지.`,
        });
      }
    }

    // 3. 강점 부문
    const cats = Object.entries(categoryStats);
    const milongaData = cats.find(([k]) => k === 'milonga');
    const pistaData = cats.find(([k]) => k === 'pista');
    if (milongaData && pistaData) {
      const diff = milongaData[1].totalAvg - pistaData[1].totalAvg;
      if (diff > 0.2) {
        out.push({
          level: 'strength',
          title: `밀롱가가 피스타보다 ${diff.toFixed(2)}점 우위`,
          detail: `밀롱가 평균 ${milongaData[1].totalAvg.toFixed(2)} vs 피스타 ${pistaData[1].totalAvg.toFixed(2)}. 밀롱가 부문에서 우승 도전 현실적.`,
        });
      }
    }

    // 4. 진출률
    const advancedCount = myData.filter(r => r.advanced).length;
    out.push({
      level: advancedCount > 0 ? 'opportunity' : 'warning',
      title: `총 ${myData.length}회 출전 · ${advancedCount}회 결승 진출`,
      detail: advancedCount > 0 ? '결승 경험 있음. 결승 무대에서 Martin 9.94점 등 폭발력 입증.' : '아직 결승 진출 경험 없음. 부문 선택과 집중 필요.',
    });

    // 5. Milonga 특화
    if (milongaData && milongaData[1].bestRank <= 10) {
      out.push({
        level: 'strength',
        title: `밀롱가 전국 ${milongaData[1].bestRank}위 달성`,
        detail: `2023 KTC Milonga Final 6위. 준결승 9위 → 결승 6위 (3단계 상승) — 본 무대 퍼포먼스 강함.`,
      });
    }

    return out;
  }, [judgeStats, categoryStats, myData]);

  const catLabels: Record<string, string> = {
    pista: '피스타', milonga: '밀롱가', vals: '발스',
    jack_solo: '잭앤질 (석정 단독)', pista_singles_jackandjill: '잭앤질 (단독)',
  };

  return (
    <>
      <PageHeader title="Command Center" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-3 md:px-8 py-6 md:py-10 space-y-6 md:space-y-10">

          {/* HERO - 모바일에서 더 컴팩트 */}
          <section className="text-center">
            <div className="text-[9px] md:text-[10px] tracking-[0.25em] md:tracking-[0.3em] uppercase text-tango-brass font-sans mb-2 md:mb-3">
              Couple Command Center
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              석정 <em className="text-tango-brass">&amp;</em> 소유
            </h1>
            <p className="text-xs md:text-sm text-tango-cream/60 mt-2 md:mt-3 font-serif italic px-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              모든 대회 데이터를 한 화면에 · Mundial 우승 전략
            </p>
            <OrnamentDivider className="mt-4 md:mt-6" />
          </section>

          {/* 점수 트렌드 그래프 — 시간 순 추이 */}
          {myData.length >= 2 && (
            <section className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4 md:p-5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                Score Trend · 시간 따라
              </div>
              <h2 className="font-display text-xl md:text-2xl text-tango-paper italic mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                나아지고 있는가?
              </h2>
              <ScoreTrendChart records={myData} />
            </section>
          )}

          {/* 전략 인사이트 배너 */}
          {insights.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((ins, i) => (
                <div
                  key={i}
                  className={`rounded-sm border p-4 ${
                    ins.level === 'strength' ? 'border-tango-brass/40 bg-tango-brass/10' :
                    ins.level === 'warning' ? 'border-orange-500/30 bg-orange-500/5' :
                    'border-tango-brass/20 bg-white/5'
                  }`}
                >
                  <div className={`text-[10px] uppercase tracking-widest font-sans mb-1 ${
                    ins.level === 'strength' ? 'text-tango-brass' :
                    ins.level === 'warning' ? 'text-orange-400' :
                    'text-tango-cream/60'
                  }`}>
                    {ins.level === 'strength' ? '✓ 강점' : ins.level === 'warning' ? '⚠ 개선 필요' : '💡 기회'}
                  </div>
                  <div className="font-display italic text-lg text-tango-paper mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {ins.title}
                  </div>
                  <div className="text-xs text-tango-cream/70 font-serif italic leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {ins.detail}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* 🎬 우리 영상 갤러리 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Our Competition Videos · 우리가 춤춘 영상
            </div>
            <h2 className="font-display italic text-2xl md:text-3xl text-tango-paper mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우리의 <em className="text-tango-brass">무대</em>
            </h2>
            <p className="text-xs text-tango-cream/60 mb-5 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              실제 대회에서 춤춘 모든 영상 — 썸네일 클릭하면 바로 재생
            </p>

            {/* 현재 재생 중 플레이어 — 곡/참가자/심사 메타 정보 포함 */}
            {playingVideo && (() => {
              const rounds = (roundsData as any).rounds as Array<any>;
              const round = rounds.find(r => (r.videos || []).some((v: any) => v.video_id === playingVideo));
              if (!round) {
                return (
                  <div className="mb-4 rounded-sm overflow-hidden border border-tango-brass/40 bg-tango-shadow">
                    <div className="flex items-center justify-between px-3 py-2 bg-tango-brass/10 border-b border-tango-brass/20">
                      <span className="text-xs text-tango-brass font-semibold">▶ 재생 중</span>
                      <button onClick={() => setPlayingVideo(null)} className="text-tango-cream/60 hover:text-red-400 text-sm">✕ 닫기</button>
                    </div>
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                      <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`} title="영상" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                    </div>
                  </div>
                );
              }
              const v = round.videos.find((v: any) => v.video_id === playingVideo);
              // 내가 받은 점수 매핑 (현재 round와 일치하는 myData 기록)
              const myRec = myData.find(r =>
                r.year === round.year &&
                r.category === round.category &&
                r.stage === round.stage
              );
              const myScoresByJudge: Record<string, number> = {};
              if (myRec) {
                myRec.judges.forEach((j, i) => { myScoresByJudge[j] = myRec.scores[i]; });
              }

              const songs: VideoSong[] = (round.songs || []).map((s: any) => ({
                song_id: s.song_id, title: s.title, orchestra: s.orchestra, order: s.order, vocalist: s.vocalist,
              }));
              const participants: VideoParticipant[] = (round.participants || []).map((p: any) => ({
                pareja: p.pareja, leader: p.leader, follower: p.follower, rank: p.rank,
                advancedTo: p.advancedTo, isMyCouple: p.pareja === 180 || p.pareja === 340,
              }));

              return (
                <div className="mb-4 relative">
                  <button
                    onClick={() => setPlayingVideo(null)}
                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-tango-ink/80 text-tango-cream/80 hover:bg-red-500/80 hover:text-white flex items-center justify-center"
                    title="닫기"
                  >
                    ✕
                  </button>
                  <TaggedVideoPlayer
                    video={{
                      video_id: playingVideo,
                      title: v?.title,
                      channel: v?.channel,
                      start_sec: v?.start_sec,
                      song_timestamps: v?.song_timestamps,
                    }}
                    songs={songs}
                    participants={participants}
                    judges={round.judges || []}
                    myJudgeScores={myScoresByJudge}
                    roundInfo={{
                      competition: round.competition,
                      year: round.year,
                      stage: round.stage,
                      ronda: round.ronda_number,
                      group: round.group,
                    }}
                    highlight={round.highlight || (myRec ? `🌟 우리 출전 · ${myRec.rank}위` : undefined)}
                    autoPlay
                  />
                </div>
              );
            })()}

            {/* 영상 썸네일 그리드 - 모바일에선 2열 고정 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {Object.entries(MY_VIDEOS).map(([key, video]) => {
                const isFinal = key.includes('final') && !key.includes('semi');
                const isPlaying = playingVideo === video.id;
                return (
                  <button
                    key={key}
                    onClick={() => setPlayingVideo(isPlaying ? null : video.id)}
                    className={`group relative aspect-video rounded-sm overflow-hidden border transition-all ${
                      isPlaying ? 'border-tango-brass ring-2 ring-tango-brass/40' :
                      isFinal ? 'border-tango-brass/50 hover:border-tango-brass' :
                      'border-tango-brass/20 hover:border-tango-brass/50'
                    }`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                      alt={video.label}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-1.5 md:p-2">
                      {video.group && (
                        <div className="text-[8px] md:text-[9px] tracking-widest uppercase text-tango-brass font-sans mb-0.5">
                          {video.group}
                        </div>
                      )}
                      <div className="text-[10px] md:text-[11px] text-tango-paper font-serif italic leading-tight line-clamp-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {video.label}
                      </div>
                    </div>
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
                        isFinal ? 'bg-tango-brass' : 'bg-tango-brass/80 group-hover:bg-tango-brass'
                      }`}>
                        <span className="text-tango-ink text-base md:text-lg ml-0.5">▶</span>
                      </div>
                    </div>
                    {isFinal && (
                      <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-tango-brass text-tango-ink text-[9px] font-bold px-1 md:px-1.5 py-0.5 rounded-sm">
                        🏆
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 부문별 성적 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Category Performance
            </div>
            <h2 className="font-display italic text-2xl md:text-3xl text-tango-paper mb-4 md:mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              부문별 <em className="text-tango-brass">성적</em>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(categoryStats).map(([cat, s]) => {
                const topPercent = s.records.length > 0 && s.records[0].total_participants
                  ? (s.bestRank / s.records[0].total_participants! * 100).toFixed(0) : '-';
                return (
                  <div key={cat} className="bg-tango-shadow/60 border border-tango-brass/20 rounded-sm p-4">
                    <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-1">
                      {catLabels[cat] ?? cat}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-display text-3xl font-bold text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {s.totalAvg.toFixed(2)}
                      </span>
                      <span className="text-xs text-tango-cream/50">평균</span>
                    </div>
                    <div className="text-xs text-tango-paper/80 space-y-0.5 font-sans">
                      <div>최고 순위: <span className="text-tango-brass font-semibold">{s.bestRank}위</span> ({topPercent}%)</div>
                      <div>출전 횟수: {s.records.length}회</div>
                      <div>결승 진출률: {(s.advanceRate * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 심사위원 히트맵 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Judge Heat Map · 심사위원별 점수 패턴
            </div>
            <h2 className="font-display italic text-2xl md:text-3xl text-tango-paper mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우리를 <em className="text-tango-brass">보는 눈</em>
            </h2>
            <p className="text-xs text-tango-cream/60 mb-5 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              과거 받은 스코어 집계 — 평균이 높을수록 이 심사위원 스타일과 맞음
            </p>
            <div className="space-y-2">
              {judgeStats.map(j => {
                const pct = (j.avg / 10) * 100;
                const reliable = j.samples.length >= 2;
                return (
                  <div key={j.name} className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-3">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {j.name}
                        </span>
                        {!reliable && <span className="text-[10px] text-tango-cream/40 ml-2">샘플 1회</span>}
                      </div>
                      <div className="text-right">
                        <span className="font-display text-xl font-bold text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                          {j.avg.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-tango-cream/50 ml-1">/10</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          j.avg >= 9 ? 'bg-tango-brass' :
                          j.avg >= 8.3 ? 'bg-tango-brass/70' :
                          j.avg >= 7.8 ? 'bg-tango-brass/40' : 'bg-orange-500/50'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 text-[10px] text-tango-cream/50 font-sans">
                      {j.samples.length}회 심사 · 최저 {j.min} ~ 최고 {j.max}
                      {j.samples.map((s, i) => (
                        <span key={i} className="ml-2 inline-block">
                          <span className="text-tango-brass/60">{s.score}</span>
                          <span className="text-tango-cream/30"> ({s.year})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 전체 출전 기록 타임라인 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Full Competition History
            </div>
            <h2 className="font-display italic text-2xl md:text-3xl text-tango-paper mb-4 md:mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              대회 <em className="text-tango-brass">출전 기록</em>
            </h2>
            <div className="space-y-3">
              {myData.map((r, i) => {
                const vKey = `${r.year}-${r.category}-${r.stage}`;
                const video = MY_VIDEOS[vKey];
                return (
                  <div
                    key={i}
                    className={`rounded-sm border p-3 md:p-4 ${
                      r.advanced ? 'border-tango-brass/40 bg-tango-brass/5' :
                      'border-tango-brass/15 bg-white/3'
                    }`}
                  >
                    {/* 모바일: 제목+점수 쌓이기 · 데스크톱: 한 줄 */}
                    <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-display text-xl md:text-2xl font-bold text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            {r.year}
                          </span>
                          <span className="font-serif italic text-base md:text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {r.competition} {catLabels[r.category] ?? r.category} · {r.stage === 'final' ? '결승' : r.stage === 'semifinal' ? '준결승' : '예선'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {r.is_solo && <span className="text-[10px] text-tango-cream/50">(석정 단독)</span>}
                          {r.advanced && <span className="text-[10px] bg-tango-brass/20 text-tango-brass rounded-sm px-2 py-0.5">✓ 결승 진출</span>}
                          {video && (
                            <button
                              onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)}
                              className="text-[10px] bg-tango-rose/20 text-tango-rose rounded-sm px-2 py-0.5 hover:bg-tango-rose/30"
                              title="이 영상 재생"
                            >
                              ▶ 영상
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex md:block items-baseline gap-2 md:gap-0">
                        <div className="text-xs text-tango-cream/50">
                          <span className="font-display text-lg md:text-xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                            {r.rank}
                          </span>
                          {r.total_participants && <span className="text-tango-cream/40">/{r.total_participants}</span>}
                        </div>
                        <div className="text-[10px] text-tango-cream/50">평균 {r.avg.toFixed(3)}</div>
                      </div>
                    </div>
                    {/* 심사별 점수 - 모바일 2열 고정 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2 mt-2">
                      {r.judges.map((j, idx) => (
                        <div key={idx} className="bg-white/5 rounded-sm px-2 py-1 flex items-baseline justify-between gap-1">
                          <span className="text-[10px] text-tango-cream/60 truncate">{j}</span>
                          <span className="font-mono text-sm text-tango-brass font-semibold flex-shrink-0">{r.scores[idx]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 📹 영상 보며 연습 — 약점 기반 추천 */}
          {(() => {
            // 가장 낮은 점수 받은 기록 추출 (약점 우선 연습)
            if (myData.length === 0) return null;
            const weakest = [...myData]
              .filter(r => r.judges.length > 0)
              .map(r => {
                const lowIdx = r.scores.indexOf(Math.min(...r.scores));
                return { record: r, weakJudge: r.judges[lowIdx], weakScore: r.scores[lowIdx] };
              })
              .sort((a, b) => a.weakScore - b.weakScore)
              .slice(0, 3);
            if (weakest.length === 0) return null;
            return (
              <section>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  Practice Recommendations · 약점 기반 연습
                </div>
                <h2 className="font-display italic text-2xl md:text-3xl text-tango-paper mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  📹 이 영상 보며 <em className="text-tango-brass">복습</em>
                </h2>
                <p className="text-xs text-tango-cream/60 mb-4 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  가장 낮은 점수 받은 기록 — 그 영상을 보며 약점 파악 + 연습 방향 설정
                </p>
                <div className="space-y-2">
                  {weakest.map((w, i) => {
                    const vKey = `${w.record.year}-${w.record.category}-${w.record.stage}`;
                    const video = MY_VIDEOS[vKey];
                    return (
                      <div key={i} className="rounded-sm border border-orange-500/20 bg-orange-500/5 p-3">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] uppercase tracking-widest text-orange-400 font-sans mb-0.5">
                              약점 포인트 #{i + 1}
                            </div>
                            <div className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              {w.record.year} {catLabels[w.record.category] ?? w.record.category} · {w.record.stage === 'final' ? '결승' : '준결승'}
                            </div>
                            <div className="text-xs text-tango-cream/60 mt-0.5">
                              <span className="text-orange-400 font-semibold">{w.weakJudge}</span>에게 가장 낮은 점수{' '}
                              <span className="font-mono text-orange-400 font-bold">{w.weakScore}</span>
                              {' '}— 이 기준 보강 필요
                            </div>
                          </div>
                          {video && (
                            <button
                              onClick={() => setPlayingVideo(playingVideo === video.id ? null : video.id)}
                              className="flex-shrink-0 bg-tango-brass/20 hover:bg-tango-brass/30 text-tango-brass rounded-sm px-3 py-2 text-xs font-semibold"
                            >
                              📹 영상 보며 연습
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-tango-cream/70 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          <Link to="/training" className="text-tango-brass hover:underline">
                            → 연습 노트 작성
                          </Link>
                          {' '}· 다음에 {w.weakJudge} 심사 있으면 집중
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

          {/* 다음 대회 액션 */}
          <section className="bg-gradient-to-br from-tango-brass/10 to-transparent border border-tango-brass/30 rounded-sm p-6">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              Next Competition Strategy
            </div>
            <h3 className="font-display italic text-2xl text-tango-paper mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              다음 대회 <em className="text-tango-brass">준비 포인트</em>
            </h3>
            <div className="space-y-2 text-sm text-tango-paper/90 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              <div>🎯 <strong className="text-tango-brass not-italic">최우선:</strong> 밀롱가 부문 — 이미 6위 도달, 3위권 도전 가능</div>
              <div>🔧 <strong className="text-tango-brass not-italic">기본기 보강:</strong> Martin/Valelia/Juan Carlos 기준 기본기·리듬 정확성</div>
              <div>💎 <strong className="text-tango-brass not-italic">유지:</strong> Oscar/Carolina 감성·표현 기준 (이미 최상위)</div>
              <div>📅 <strong className="text-tango-brass not-italic">타깃 대회:</strong> 2026 KTC (3월) → 2026 PTC → 2026 Mundial Asia 예선</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/tanda-simulator" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                탄다 시뮬레이터 →
              </Link>
              <Link to="/judges" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                심사위원 분석 →
              </Link>
              <Link to="/champions" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                역대 우승자 →
              </Link>
              <Link to="/my-competitions" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
                대회 기록 관리 →
              </Link>
            </div>
          </section>

          <OrnamentDivider className="pt-6" />
        </div>
      </div>
    </>
  );
}

// 점수 트렌드 차트 — 시간 순으로 평균 점수 추이
function ScoreTrendChart({ records }: { records: MyRecord[] }) {
  const sorted = [...records].sort((a, b) => a.year - b.year || a.event_key.localeCompare(b.event_key));

  // 점수 범위 (8.0 ~ 10.0 기준)
  const minScore = 7.5;
  const maxScore = 10;
  const range = maxScore - minScore;
  const W = 100; // % 기반
  const H = 200; // px

  // 카테고리별 색상
  const catColors: Record<string, string> = {
    pista: '#5D7A8E',
    milonga: '#D4AF37',
    vals: '#7A8E6E',
    pista_singles_jackandjill: '#C72C1C',
  };
  const catLabels: Record<string, string> = {
    pista: '피스타', milonga: '밀롱가', vals: '발스', pista_singles_jackandjill: '잭앤질',
  };

  const points = sorted.map((r, i) => ({
    x: (i / Math.max(1, sorted.length - 1)) * W,
    y: H - ((r.avg - minScore) / range) * H,
    r,
  }));

  const overallTrend = sorted.length >= 2
    ? sorted[sorted.length - 1].avg - sorted[0].avg
    : 0;

  return (
    <div>
      {/* 추세 요약 */}
      <div className="flex items-center gap-3 mb-4 text-sm">
        <span className="text-tango-cream/60 font-sans">전체 추세</span>
        <span
          className="font-display text-2xl font-bold"
          style={{
            color: overallTrend >= 0.1 ? '#7A8E6E' : overallTrend <= -0.1 ? '#C72C1C' : '#B0936F',
            fontFamily: '"Playfair Display", Georgia, serif',
          }}
        >
          {overallTrend >= 0 ? '+' : ''}{overallTrend.toFixed(2)}점
        </span>
        <span className="text-xs text-tango-cream/50 font-serif italic">
          {sorted[0]?.year} → {sorted[sorted.length - 1]?.year}
        </span>
      </div>

      {/* SVG 그래프 */}
      <div className="relative bg-tango-ink/40 border border-tango-brass/15 rounded-sm p-4">
        <svg viewBox={`-5 -5 ${W + 10} ${H + 35}`} preserveAspectRatio="none" className="w-full h-48">
          {/* Y축 grid */}
          {[8, 8.5, 9, 9.5, 10].map(score => {
            const y = H - ((score - minScore) / range) * H;
            return (
              <g key={score}>
                <line x1={0} x2={W} y1={y} y2={y} stroke="#C8A44E" strokeOpacity="0.1" strokeDasharray="1,1" strokeWidth="0.3" />
                <text x={-2} y={y + 1} fontSize="3" fill="#C8A44E" fillOpacity="0.5" textAnchor="end" fontFamily="ui-monospace,monospace">
                  {score}
                </text>
              </g>
            );
          })}

          {/* 추세선 (전체) */}
          {points.length >= 2 && (
            <polyline
              fill="none"
              stroke="#C8A44E"
              strokeOpacity="0.4"
              strokeWidth="0.5"
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
            />
          )}

          {/* 데이터 포인트 */}
          {points.map((p, i) => {
            const color = catColors[p.r.category] || '#C8A44E';
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="1.8" fill={color} stroke="#0a0807" strokeWidth="0.3" />
                <text x={p.x} y={H + 6} fontSize="2.5" fill="#E0D5BC" fillOpacity="0.6" textAnchor="middle" fontFamily="ui-sans-serif,sans-serif">
                  {p.r.year}
                </text>
                <text x={p.x} y={p.y - 3} fontSize="2.5" fill={color} textAnchor="middle" fontFamily="ui-monospace,monospace" fontWeight="bold">
                  {p.r.avg.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 범례 */}
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] tracking-widest uppercase font-sans">
          {Array.from(new Set(sorted.map(r => r.category))).map(cat => (
            <span key={cat} className="flex items-center gap-1 text-tango-cream/60">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColors[cat] || '#C8A44E' }} />
              {catLabels[cat] || cat}
            </span>
          ))}
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-[10px] tracking-widest uppercase text-tango-cream/40">
            <tr>
              <th className="text-left py-1">대회</th>
              <th className="text-left py-1">부문</th>
              <th className="text-left py-1">단계</th>
              <th className="text-right py-1">평균</th>
              <th className="text-right py-1">순위</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} className="border-t border-tango-brass/10 text-tango-cream/80">
                <td className="py-1.5 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  {r.year} {r.competition.replace('Korea Tango Championship', 'KTC')}
                </td>
                <td className="py-1.5">
                  <span style={{ color: catColors[r.category] || '#C8A44E' }}>
                    {catLabels[r.category] || r.category}
                  </span>
                </td>
                <td className="py-1.5">
                  {r.stage === 'final' ? '결승' : r.stage === 'semifinal' ? '준결승' : '예선'}
                </td>
                <td className="py-1.5 text-right font-mono text-tango-brass font-semibold">
                  {r.avg.toFixed(2)}
                </td>
                <td className="py-1.5 text-right">{r.rank}{r.total_participants ? `/${r.total_participants}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
