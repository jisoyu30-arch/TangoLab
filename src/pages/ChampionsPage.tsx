// 역대 우승자 분석 — Mundial 챔피언이 춤춘 곡·악단·패턴
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { TrendInsight } from '../components/TrendInsight';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import { isPerformanceVideo } from '../utils/videoTypes';
import roundsData from '../data/competition_rounds.json';
import songsData from '../data/songs.json';
import type { Song } from '../types/tango';

const songs = songsData as Song[];
const rounds = (roundsData as any).rounds;
const songMap = new Map(songs.map(s => [s.song_id, s]));

// 역대 우승자
const CHAMPIONS: Record<string, { leader: string; follower: string; country: string }> = {
  '2025': { leader: 'Diego Ortega', follower: 'Aldana Silveyra', country: 'Argentina' },
  '2024': { leader: 'Brenno Lucas Márquez', follower: 'Fátima Caracoch', country: 'Argentina/Brazil' },
  '2023': { leader: 'Suyay Quiroga', follower: 'Jhonny Carvajal', country: 'Argentina' },
  '2022': { leader: 'Constanza Vieyto', follower: 'Ricardo Astrada', country: 'Argentina' },
  '2019': { leader: 'Agustina Piaggio', follower: 'Maxim Gerasimov', country: 'Argentina/Russia' },
};

export function ChampionsPage() {
  const analysis = useMemo(() => {
    // 결승 곡 전체
    const finalSongs: Array<{ year: number; song_id: string; title: string; orchestra: string; order: number }> = [];
    const finalRoundsData = rounds.filter((r: any) => r.competition === 'Mundial' && r.stage === 'final' && r.songs?.length > 0);

    for (const r of finalRoundsData) {
      for (const s of r.songs) {
        finalSongs.push({ year: r.year, ...s });
      }
    }

    // 악단별 빈도
    const orchFreq: Record<string, number> = {};
    const songFreq: Record<string, { count: number; song: Song | undefined }> = {};

    for (const s of finalSongs) {
      const o = shortOrchestraName(s.orchestra || '');
      if (o && o !== '?') orchFreq[o] = (orchFreq[o] || 0) + 1;
      if (s.song_id) {
        if (!songFreq[s.song_id]) songFreq[s.song_id] = { count: 0, song: songMap.get(s.song_id) };
        songFreq[s.song_id].count++;
      }
    }

    const topOrchs = Object.entries(orchFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topSongs = Object.entries(songFreq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, d]) => ({ song_id: id, count: d.count, song: d.song }));

    // 포지션별 악단 (1번째/2번째/3번째)
    const positionFreq: Record<string, { pos1: number; pos2: number; pos3: number }> = {};
    for (const s of finalSongs) {
      const o = shortOrchestraName(s.orchestra || '');
      if (!o || o === '?') continue;
      if (!positionFreq[o]) positionFreq[o] = { pos1: 0, pos2: 0, pos3: 0 };
      if (s.order === 1) positionFreq[o].pos1++;
      else if (s.order === 2) positionFreq[o].pos2++;
      else if (s.order === 3) positionFreq[o].pos3++;
    }

    // 결승 퍼포먼스 영상 (대회 영상만)
    const perfVideos = finalRoundsData
      .flatMap((r: any) =>
        (r.videos || [])
          .filter((v: any) => isPerformanceVideo(v))
          .map((v: any) => ({ ...v, year: r.year, ronda: r.ronda_number }))
      )
      .slice(0, 12);

    return { topOrchs, topSongs, positionFreq, totalFinalRondas: finalRoundsData.length, perfVideos, finalSongs };
  }, []);

  const years = Object.keys(CHAMPIONS).sort().reverse();

  return (
    <>
      <PageHeader title="우승자 분석" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-12">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Strategy · Champion Analysis
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우승자는 <em className="text-tango-brass">무엇을</em> 춤췄는가
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic max-w-2xl mx-auto">
              Mundial 결승 곡·악단 패턴 분석 — 우승 전략을 위한 데이터
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 역대 챔피언 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-4">
              Hall of Champions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {years.map(year => (
                <Link
                  key={year}
                  to={`/mundial/${year}`}
                  className="bg-tango-shadow/60 hover:bg-tango-shadow border border-tango-brass/20 hover:border-tango-brass/40 rounded-sm p-5 transition-all group"
                >
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-display text-3xl text-tango-brass font-bold italic leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {year}
                    </span>
                    <span className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">
                      {CHAMPIONS[year].country}
                    </span>
                  </div>
                  <h3 className="font-display italic text-xl text-tango-paper group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {CHAMPIONS[year].leader}
                  </h3>
                  <p className="font-serif italic text-sm text-tango-cream/70 mt-0.5" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    & {CHAMPIONS[year].follower}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* 결승 악단 TOP 8 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Finals · Most Used Orchestras
            </div>
            <h2 className="font-display text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              결승에서 울려 퍼진 <em className="text-tango-brass">악단 TOP 8</em>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-tango-brass/15 rounded-sm overflow-hidden">
              {analysis.topOrchs.map(([o, count], i) => {
                const pos = analysis.positionFreq[o];
                return (
                  <div key={o} className="bg-tango-ink p-5 md:p-6">
                    <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mb-2 font-sans">
                      No. {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-display italic text-2xl text-tango-paper leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {o}
                    </h3>
                    <div className="font-display text-3xl text-tango-brass font-bold mt-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {count}<span className="text-sm font-sans ml-1 text-tango-cream/60 font-normal">회</span>
                    </div>
                    {pos && (
                      <div className="flex gap-2 text-[10px] mt-3 font-sans">
                        <span className="text-tango-brass/70">1st {pos.pos1}</span>
                        <span className="text-tango-brass/70">2nd {pos.pos2}</span>
                        <span className="text-tango-brass/70">3rd {pos.pos3}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <TrendInsight
              context={`Mundial 결승 ${analysis.totalFinalRondas}개 라운드에서 TOP 악단: ${analysis.topOrchs.map(([o, c]) => `${o}(${c}회)`).join(', ')}. 포지션 분포: ${Object.entries(analysis.positionFreq).slice(0, 5).map(([o, p]) => `${o}: 1st=${p.pos1}/2nd=${p.pos2}/3rd=${p.pos3}`).join('; ')}.`}
              cacheKey="champions-orchestras"
              title="우승 전략 인사이트"
            />
          </section>

          {/* 결승 곡 TOP 10 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Finals · Most Used Songs
            </div>
            <h2 className="font-display text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              결승에서 <em className="text-tango-brass">여러 번 선택된 곡들</em>
            </h2>
            <div className="space-y-0">
              {analysis.topSongs.map((s, i) => (
                <Link
                  key={s.song_id}
                  to={`/song/${s.song_id}`}
                  className="group grid grid-cols-[50px_1fr_auto] items-baseline gap-4 py-4 border-b border-tango-brass/15 hover:bg-tango-brass/5 px-3 -mx-3 transition-colors"
                >
                  <span className="font-display text-2xl md:text-3xl text-tango-brass/50 italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display italic text-xl text-tango-paper group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {s.song?.title || s.song_id}
                    </div>
                    <div className="text-[11px] tracking-widest uppercase text-tango-cream/50 font-sans mt-0.5 truncate">
                      {s.song?.orchestra || '미상'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {s.count}
                    </div>
                    <div className="text-[9px] tracking-widest uppercase text-tango-cream/40">결승</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 결승 실제 대회 영상 */}
          {analysis.perfVideos.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                Final Performances · Real Footage
              </div>
              <h2 className="font-display text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                결승 <em className="text-tango-brass">실제 영상</em>
              </h2>
              <p className="text-xs text-tango-cream/60 font-serif italic mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                우승자와 결승 진출자들의 실제 퍼포먼스만 모았습니다 (음악 전용 영상 제외)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.perfVideos.map((v: any) => (
                  <a
                    key={v.video_id}
                    href={`https://www.youtube.com/watch?v=${v.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-video bg-tango-shadow/60 border border-tango-brass/20 hover:border-tango-brass rounded-sm overflow-hidden transition-all"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`}
                      alt={v.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                      <div className="text-[9px] tracking-widest uppercase text-tango-brass font-sans">
                        {v.year} · Final R{v.ronda}
                      </div>
                      <div className="text-xs text-tango-paper font-serif italic line-clamp-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {v.title}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-tango-paper/80 group-hover:text-tango-brass text-xl">▶</div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}
