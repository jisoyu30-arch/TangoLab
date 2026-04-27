// 트렌드 분석 대시보드 — 연도별 악단 인기, 곡 TOP 변천사, 히트맵
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EditorialHeader, EditorialStat, OrnamentDivider } from '../components/editorial';
import { OrchestraStreamgraph } from '../components/OrchestraStreamgraph';
import { OrchestraStageChart } from '../components/OrchestraStageChart';
import { TrendInsight } from '../components/TrendInsight';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import roundsData from '../data/competition_rounds.json';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const rounds = (roundsData as any).rounds;

const songMap = new Map(songs.map(s => [s.song_id, s]));

export function TrendsPage() {
  const [stageFilter, setStageFilter] = useState<'all' | 'final' | 'semifinal' | 'qualifying'>('all');

  // 연도별 악단 출현 매트릭스
  const yearOrchMatrix = useMemo(() => {
    const filter = stageFilter === 'all' ? () => true : (a: Appearance) => a.stage === stageFilter;

    const years = new Set<number>();
    const orchCounts: Record<string, Record<number, number>> = {};
    const orchTotals: Record<string, number> = {};

    for (const a of appearances) {
      if (!filter(a)) continue;
      const song = songMap.get(a.song_id);
      const orch = shortOrchestraName(song?.orchestra || '');
      if (!orch || orch === '?') continue;

      years.add(a.year);
      if (!orchCounts[orch]) orchCounts[orch] = {};
      orchCounts[orch][a.year] = (orchCounts[orch][a.year] || 0) + 1;
      orchTotals[orch] = (orchTotals[orch] || 0) + 1;
    }

    const sortedYears = Array.from(years).sort((a, b) => a - b);
    const sortedOrchs = Object.keys(orchTotals)
      .sort((a, b) => orchTotals[b] - orchTotals[a])
      .slice(0, 10);

    return { years: sortedYears, orchestras: sortedOrchs, counts: orchCounts, totals: orchTotals };
  }, [stageFilter]);

  // 연도별 TOP 5 곡
  const topSongsByYear = useMemo(() => {
    const byYear: Record<number, Record<string, number>> = {};
    for (const a of appearances) {
      if (stageFilter !== 'all' && a.stage !== stageFilter) continue;
      if (!byYear[a.year]) byYear[a.year] = {};
      byYear[a.year][a.song_id] = (byYear[a.year][a.song_id] || 0) + 1;
    }

    const result: Array<{ year: number; songs: Array<{ song_id: string; title: string; orchestra: string; count: number }> }> = [];
    for (const [yearStr, counts] of Object.entries(byYear)) {
      const year = parseInt(yearStr);
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([sid, count]) => {
          const s = songMap.get(sid);
          return {
            song_id: sid,
            title: s?.title || sid,
            orchestra: shortOrchestraName(s?.orchestra || ''),
            count,
          };
        });
      result.push({ year, songs: sorted });
    }
    return result.sort((a, b) => b.year - a.year);
  }, [stageFilter]);

  // 전체 통계
  const stats = useMemo(() => {
    const yearRange = Array.from(new Set(appearances.map(a => a.year))).sort();
    return {
      years: yearRange.length,
      yearStart: yearRange[0],
      yearEnd: yearRange[yearRange.length - 1],
      totalApp: appearances.length,
      totalRounds: rounds.length,
      totalSongs: songs.length,
    };
  }, []);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const orch of yearOrchMatrix.orchestras) {
      for (const year of yearOrchMatrix.years) {
        const c = yearOrchMatrix.counts[orch]?.[year] || 0;
        if (c > max) max = c;
      }
    }
    return max || 1;
  }, [yearOrchMatrix]);

  return (
    <>
      <PageHeader title="트렌드 분석" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14 space-y-10">

          {/* HERO */}
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Feature · No. 01 · Trends
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              Tango <em className="text-tango-brass">Trends</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic max-w-2xl mx-auto">
              {stats.yearStart}년부터 {stats.yearEnd}년까지, 대회 음악의 변천사를 데이터로 읽다.
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <EditorialStat value={stats.years} label="수집 연도" />
            <EditorialStat value={stats.totalApp} label="출현 기록" />
            <EditorialStat value={stats.totalRounds} label="대회 라운드" />
            <EditorialStat value={stats.totalSongs} label="고유 곡" />
          </div>

          {/* 스테이지 필터 */}
          <div className="flex gap-0 border-b border-tango-brass/20 overflow-x-auto">
            {[
              { v: 'all', l: '전체' },
              { v: 'final', l: '결승' },
              { v: 'semifinal', l: '준결승' },
              { v: 'qualifying', l: '예선' },
            ].map(t => (
              <button
                key={t.v}
                onClick={() => setStageFilter(t.v as any)}
                className={`px-4 md:px-6 py-3 text-sm font-serif italic whitespace-nowrap transition-all border-b-2 ${
                  stageFilter === t.v
                    ? 'text-tango-paper border-tango-brass'
                    : 'text-tango-cream/50 border-transparent hover:text-tango-paper/80'
                }`}
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* 신규: 악단별 스테이지 분포 (결승 비율) */}
          <section>
            <EditorialHeader
              eyebrow="Stage Distribution"
              title="악단별 결승 진출 비율"
              subtitle="어떤 악단이 결승 무대에서 더 자주 선택되는가 — 우승 전략 지표"
            />
            <div className="mt-8 bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4 md:p-6">
              <OrchestraStageChart />
            </div>
          </section>

          {/* 스트림그래프: 악단 점유율 변천사 */}
          <section>
            <EditorialHeader
              eyebrow="Streamgraph"
              title="악단 점유율 변천사"
              subtitle="2012~2025, 대회 음악의 흐름"
            />
            <div className="mt-8 bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4 md:p-6">
              <OrchestraStreamgraph stageFilter={stageFilter} />
            </div>
            <TrendInsight
              context={`상위 10개 악단: ${yearOrchMatrix.orchestras.map(o => `${o}(${yearOrchMatrix.totals[o]}회)`).join(', ')}. 조사 기간 ${yearOrchMatrix.years[0]}~${yearOrchMatrix.years[yearOrchMatrix.years.length-1]}. 필터: ${stageFilter === 'all' ? '전체' : stageFilter}.`}
              cacheKey={`streamgraph-${stageFilter}`}
              title="악단 트렌드"
            />
          </section>

          {/* 히트맵: 연도 × 악단 */}
          <section>
            <EditorialHeader
              eyebrow="Heatmap"
              title="연도 × 악단 인기도"
              subtitle="진한 색상일수록 많이 선택된 악단"
            />

            <div className="mt-8 overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="text-xs">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-tango-ink text-left font-sans text-tango-cream/60 uppercase tracking-widest text-[10px] pr-4 pb-3">
                        악단
                      </th>
                      {yearOrchMatrix.years.map(y => (
                        <th key={y} className="font-sans text-tango-cream/60 text-[10px] pb-3 px-1">
                          {y}
                        </th>
                      ))}
                      <th className="font-sans text-tango-brass text-[10px] pl-4 pb-3 uppercase tracking-widest">
                        합계
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearOrchMatrix.orchestras.map(orch => (
                      <tr key={orch} className="border-t border-tango-brass/10">
                        <td className="sticky left-0 bg-tango-ink font-serif italic text-tango-paper text-sm pr-4 py-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {orch}
                        </td>
                        {yearOrchMatrix.years.map(year => {
                          const count = yearOrchMatrix.counts[orch]?.[year] || 0;
                          const intensity = count / maxCount;
                          return (
                            <td key={year} className="p-0.5">
                              <div
                                className="w-9 h-9 rounded-sm flex items-center justify-center text-[10px] font-bold font-sans transition-all hover:scale-110"
                                style={{
                                  backgroundColor: count === 0
                                    ? 'rgba(184, 134, 63, 0.05)'
                                    : `rgba(184, 134, 63, ${0.15 + intensity * 0.85})`,
                                  color: intensity > 0.5 ? '#0B0A09' : intensity > 0.2 ? '#F5F1E8' : '#B8863F',
                                }}
                                title={`${orch} · ${year} · ${count}회`}
                              >
                                {count > 0 ? count : ''}
                              </div>
                            </td>
                          );
                        })}
                        <td className="pl-4 text-tango-brass font-bold text-sm">
                          {yearOrchMatrix.totals[orch]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 연도별 TOP 5 곡 변천사 */}
          <section>
            <EditorialHeader
              eyebrow="Hall of Fame"
              title="연도별 TOP 5"
              subtitle="각 연도 대회에서 가장 많이 선택된 곡"
            />

            <div className="mt-8 space-y-px bg-tango-brass/15">
              {topSongsByYear.slice(0, 12).map(({ year, songs }) => (
                <div key={year} className="bg-tango-ink p-5 md:p-6">
                  <div className="flex items-start gap-6 md:gap-10">
                    <div className="flex-shrink-0 w-20 md:w-24">
                      <div className="font-display text-4xl md:text-5xl text-tango-brass italic font-bold leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {year}
                      </div>
                      <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 font-sans mt-2">
                        Vintage
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {songs.map((s, i) => (
                        <div key={s.song_id} className="flex items-center gap-4">
                          <span className="text-tango-brass/60 text-sm font-sans w-6">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-serif italic text-lg text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              {s.title}
                            </div>
                            <div className="text-[11px] text-tango-cream/50 tracking-wider uppercase font-sans">
                              {s.orchestra}
                            </div>
                          </div>
                          <div className="text-tango-brass text-sm font-bold flex-shrink-0">
                            {s.count}회
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}
