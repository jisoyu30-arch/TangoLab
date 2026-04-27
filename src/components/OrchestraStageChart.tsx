// 악단별 대회 스테이지 분포 차트 — 어떤 악단이 결승에서 선호되는가
import { useMemo } from 'react';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const songMap = new Map(songs.map(s => [s.song_id, s]));

interface OrchestraBar {
  orchestra: string;
  total: number;
  final: number;
  semifinal: number;
  qualifying: number;
  finalRatio: number; // 결승 비율 (전략 지표)
}

export function OrchestraStageChart() {
  const data = useMemo<OrchestraBar[]>(() => {
    const map: Record<string, { final: number; semifinal: number; qualifying: number; total: number }> = {};
    for (const a of appearances) {
      const song = songMap.get(a.song_id);
      const orch = shortOrchestraName(song?.orchestra || '');
      if (!orch || orch === '?') continue;
      if (!map[orch]) map[orch] = { final: 0, semifinal: 0, qualifying: 0, total: 0 };
      map[orch].total++;
      if (a.stage === 'final') map[orch].final++;
      else if (a.stage === 'semifinal') map[orch].semifinal++;
      else if (a.stage === 'qualifying') map[orch].qualifying++;
    }

    return Object.entries(map)
      .map(([orch, c]) => ({
        orchestra: orch,
        ...c,
        finalRatio: c.total > 0 ? c.final / c.total : 0,
      }))
      .filter(o => o.total >= 5) // 최소 5회 이상 출현 악단만
      .sort((a, b) => b.total - a.total)
      .slice(0, 12);
  }, []);

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  // 결승 비율 TOP 3 (전략적 인사이트)
  const topFinalRatio = useMemo(() =>
    [...data].filter(d => d.total >= 10).sort((a, b) => b.finalRatio - a.finalRatio).slice(0, 3),
  [data]);

  return (
    <div className="space-y-6">
      {/* 인사이트 카드 */}
      {topFinalRatio.length > 0 && (
        <div className="bg-tango-brass/10 border border-tango-brass/30 rounded-sm p-4 md:p-5">
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
            ★ Strategic Insight · 결승 비율 TOP 3
          </div>
          <div className="font-serif text-sm md:text-base text-tango-paper italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            결승 진출 비중이 높은 악단(전체 중 결승 점유 비율):
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            {topFinalRatio.map((d, i) => (
              <div key={d.orchestra} className="text-center">
                <div className="text-[9px] tracking-widest uppercase text-tango-brass/70">{i + 1}</div>
                <div className="font-serif italic text-sm md:text-base text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  {d.orchestra}
                </div>
                <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {(d.finalRatio * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-tango-cream/50">{d.final}/{d.total}회</div>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-tango-cream/60 mt-3 font-serif italic">
            → 결승 무대에서 더 자주 선택되는 악단. 우승 전략에 우선 편성 고려.
          </div>
        </div>
      )}

      {/* 스택형 막대차트 */}
      <div className="space-y-2">
        <div className="grid grid-cols-[100px_1fr_70px] md:grid-cols-[140px_1fr_90px] gap-2 md:gap-4 items-center text-[10px] tracking-widest uppercase text-tango-cream/40 font-sans">
          <div>악단</div>
          <div className="flex gap-3 text-[9px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-tango-brass" /> 결승</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-tango-brass/50" /> 준결승</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-tango-brass/20" /> 예선</span>
          </div>
          <div className="text-right">합계</div>
        </div>

        {data.map(d => (
          <div key={d.orchestra} className="grid grid-cols-[100px_1fr_70px] md:grid-cols-[140px_1fr_90px] gap-2 md:gap-4 items-center text-xs">
            <div className="font-serif italic text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }} title={d.orchestra}>
              {d.orchestra}
            </div>
            <div className="flex h-5 bg-tango-shadow/40 rounded-sm overflow-hidden" style={{ width: `${(d.total / maxTotal) * 100}%` }}>
              {d.final > 0 && (
                <div
                  className="bg-tango-brass"
                  style={{ width: `${(d.final / d.total) * 100}%` }}
                  title={`결승 ${d.final}회`}
                />
              )}
              {d.semifinal > 0 && (
                <div
                  className="bg-tango-brass/50"
                  style={{ width: `${(d.semifinal / d.total) * 100}%` }}
                  title={`준결승 ${d.semifinal}회`}
                />
              )}
              {d.qualifying > 0 && (
                <div
                  className="bg-tango-brass/20"
                  style={{ width: `${(d.qualifying / d.total) * 100}%` }}
                  title={`예선 ${d.qualifying}회`}
                />
              )}
            </div>
            <div className="text-right font-mono text-tango-brass font-semibold">
              {d.total}
              <span className="text-[10px] text-tango-cream/40 ml-1">({(d.finalRatio * 100).toFixed(0)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
