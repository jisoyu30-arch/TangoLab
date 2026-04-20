// 곡 라이프사이클 타임라인 — 특정 곡의 2012~2025 대회 출현 시각화
import { useMemo } from 'react';
import type { Appearance } from '../types/tango';

interface Props {
  appearances: Appearance[];
  minYear?: number;
  maxYear?: number;
}

const STAGE_COLOR: Record<string, string> = {
  final: '#C72C1C',        // 빨강
  semifinal: '#D4AF37',    // 골드
  quarterfinal: '#8B7A4F', // 세피아
  qualifying: '#5D7A8E',   // 슬레이트
};

const STAGE_SIZE: Record<string, number> = {
  final: 14,
  semifinal: 11,
  quarterfinal: 9,
  qualifying: 7,
};

const STAGE_LABEL: Record<string, string> = {
  final: '결승',
  semifinal: '준결승',
  quarterfinal: '8강',
  qualifying: '예선',
};

export function SongLifecycleTimeline({ appearances, minYear, maxYear }: Props) {
  const { years, bucketed, stats } = useMemo(() => {
    if (appearances.length === 0) return { years: [], bucketed: {}, stats: { total: 0, firstYear: 0, lastYear: 0 } };

    const yearSet = new Set(appearances.map(a => a.year));
    const computed = {
      minY: minYear || Math.min(...appearances.map(a => a.year)),
      maxY: maxYear || Math.max(...appearances.map(a => a.year)),
    };
    const yrs: number[] = [];
    for (let y = computed.minY; y <= computed.maxY; y++) yrs.push(y);

    // 연도별 appearance 그룹
    const buckets: Record<number, Appearance[]> = {};
    for (const a of appearances) {
      if (!buckets[a.year]) buckets[a.year] = [];
      buckets[a.year].push(a);
    }

    return {
      years: yrs,
      bucketed: buckets,
      stats: {
        total: appearances.length,
        firstYear: Math.min(...yearSet),
        lastYear: Math.max(...yearSet),
      },
    };
  }, [appearances, minYear, maxYear]);

  if (years.length === 0) {
    return (
      <div className="text-sm text-tango-cream/50 text-center py-6 font-serif italic">
        출현 기록이 없습니다
      </div>
    );
  }

  const width = 900;
  const rowHeight = 44;
  const padding = { top: 40, right: 20, bottom: 30, left: 70 };
  const chartW = width - padding.left - padding.right;
  const stepX = chartW / Math.max(1, years.length - 1);

  // stage별로 row 분리
  const stagesShown = ['final', 'semifinal', 'quarterfinal', 'qualifying'].filter(
    st => appearances.some(a => a.stage === st)
  );
  const height = padding.top + padding.bottom + stagesShown.length * rowHeight;

  return (
    <div className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
            Lifecycle
          </div>
          <h3 className="font-display italic text-xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            대회 출현 타임라인
          </h3>
          <p className="text-[11px] text-tango-cream/50 font-sans mt-1">
            {stats.total}회 · {stats.firstYear}–{stats.lastYear}
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-sans">
          {stagesShown.map(st => (
            <div key={st} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: STAGE_COLOR[st] }} />
              <span className="text-tango-cream/70">{STAGE_LABEL[st]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ minWidth: '600px' }}>
          {/* X축 라인 (각 stage row) */}
          {stagesShown.map((st, i) => {
            const y = padding.top + i * rowHeight + rowHeight / 2;
            return (
              <g key={st}>
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#B8863F"
                  fontFamily="Inter, sans-serif"
                >
                  {STAGE_LABEL[st]}
                </text>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#B8863F"
                  strokeOpacity="0.15"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* 연도 grid + 라벨 */}
          {years.map((year, i) => {
            const x = padding.left + i * stepX;
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={padding.top - 6}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#B8863F"
                  strokeOpacity="0.08"
                  strokeWidth="1"
                />
                {i % 2 === 0 && (
                  <text
                    x={x}
                    y={padding.top - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#F5F1E8"
                    fontFamily="Inter, sans-serif"
                    opacity="0.6"
                  >
                    {year}
                  </text>
                )}
              </g>
            );
          })}

          {/* 점 (appearance) */}
          {years.map((year, i) => {
            const bucket = bucketed[year] || [];
            const x = padding.left + i * stepX;
            return bucket.map((a, j) => {
              const rowIdx = stagesShown.indexOf(a.stage);
              if (rowIdx < 0) return null;
              const y = padding.top + rowIdx * rowHeight + rowHeight / 2;
              const offset = (j - (bucket.length - 1) / 2) * 12;
              return (
                <circle
                  key={`${year}-${j}`}
                  cx={x + offset}
                  cy={y}
                  r={STAGE_SIZE[a.stage] / 2}
                  fill={STAGE_COLOR[a.stage]}
                  fillOpacity="0.85"
                  stroke={STAGE_COLOR[a.stage]}
                  strokeWidth="1"
                >
                  <title>{year} {STAGE_LABEL[a.stage]}</title>
                </circle>
              );
            });
          })}
        </svg>
      </div>
    </div>
  );
}
