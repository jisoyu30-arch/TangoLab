// 악단 점유율 스트림그래프 — 연도별 악단 인기 변천사
import { useMemo } from 'react';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const songMap = new Map(songs.map(s => [s.song_id, s]));

// 각 악단 고유 컬러 (탱고 팔레트)
const ORCH_COLORS: Record<string, string> = {
  "D'Arienzo": '#C72C1C',   // 빨강 (에너지)
  'Di Sarli': '#D4AF37',    // 골드 (우아함)
  'Pugliese': '#6B1F2E',    // 버건디 (드라마)
  'Tanturi': '#8B7A4F',     // 세피아 (멜로디)
  'Troilo': '#4A6FA5',      // 차분한 파랑
  'Caló': '#B85C38',        // 구리
  "D'Agostino": '#9B7B4A',  // 브라운
  'Laurenz': '#7A8E6E',     // 올리브
  'Biagi': '#E68F4A',       // 오렌지
  'Fresedo': '#5D7A8E',     // 슬레이트
  'Demare': '#A8857A',      // 로즈 브라운
  'Gobbi': '#6E8B5F',       // 세이지
};

const DEFAULT_COLOR = '#888';

export function OrchestraStreamgraph({ stageFilter }: { stageFilter?: string }) {
  const data = useMemo(() => {
    const yearOrchCounts: Record<number, Record<string, number>> = {};
    const orchTotals: Record<string, number> = {};

    for (const a of appearances) {
      if (stageFilter && stageFilter !== 'all' && a.stage !== stageFilter) continue;
      const song = songMap.get(a.song_id);
      const orch = shortOrchestraName(song?.orchestra || '');
      if (!orch || orch === '?') continue;

      if (!yearOrchCounts[a.year]) yearOrchCounts[a.year] = {};
      yearOrchCounts[a.year][orch] = (yearOrchCounts[a.year][orch] || 0) + 1;
      orchTotals[orch] = (orchTotals[orch] || 0) + 1;
    }

    const years = Object.keys(yearOrchCounts).map(Number).sort((a, b) => a - b);
    const topOrchs = Object.keys(orchTotals)
      .sort((a, b) => orchTotals[b] - orchTotals[a])
      .slice(0, 8);

    // 각 연도별 비율 계산 (정규화)
    const rawData: Record<string, number[]> = {};
    for (const orch of topOrchs) {
      rawData[orch] = years.map(y => yearOrchCounts[y]?.[orch] || 0);
    }

    // 스무딩
    function smooth(arr: number[], window = 1): number[] {
      if (arr.length < 3) return arr;
      return arr.map((_, i) => {
        let sum = 0, count = 0;
        for (let j = Math.max(0, i - window); j <= Math.min(arr.length - 1, i + window); j++) {
          sum += arr[j];
          count++;
        }
        return sum / count;
      });
    }

    const smoothed: Record<string, number[]> = {};
    for (const orch of topOrchs) smoothed[orch] = smooth(rawData[orch]);

    return { years, orchs: topOrchs, data: smoothed };
  }, [stageFilter]);

  if (data.years.length < 3) {
    return (
      <div className="text-sm text-tango-cream/50 text-center py-8 font-serif italic">
        데이터가 부족합니다
      </div>
    );
  }

  const width = 900;
  const height = 280;
  const padding = { top: 20, right: 120, bottom: 40, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 각 year별 합계
  const yearTotals = data.years.map((_, i) =>
    data.orchs.reduce((sum, o) => sum + data.data[o][i], 0) || 1
  );

  const xScale = (i: number) =>
    padding.left + (i / Math.max(1, data.years.length - 1)) * chartW;

  // stream graph — 각 orch의 baseline을 중앙에 오게 적재 (wiggle 단순화)
  // 각 x에서 상단/하단 경계 계산
  const orchPaths: string[] = [];
  for (let oi = 0; oi < data.orchs.length; oi++) {
    const orch = data.orchs[oi];
    let pathTop = '';
    let pathBottom = '';

    for (let i = 0; i < data.years.length; i++) {
      // 누적 상단/하단 (symmetric)
      let offset = 0;
      for (let oj = 0; oj < oi; oj++) {
        offset += data.data[data.orchs[oj]][i];
      }
      const val = data.data[orch][i];
      const total = yearTotals[i];

      // symmetric stream: center baseline
      const centerY = padding.top + chartH / 2;
      const scale = chartH / Math.max(...yearTotals);

      const topY = centerY - (total / 2 - offset) * scale;
      const bottomY = topY + val * scale;

      const x = xScale(i);
      if (i === 0) {
        pathTop += `M ${x} ${topY}`;
        pathBottom = `L ${x} ${bottomY}` + pathBottom;
      } else {
        pathTop += ` L ${x} ${topY}`;
        pathBottom = `L ${x} ${bottomY}` + pathBottom;
      }
    }

    orchPaths.push(`${pathTop} ${pathBottom} Z`);
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          {data.orchs.map((orch, i) => (
            <linearGradient key={orch} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ORCH_COLORS[orch] || DEFAULT_COLOR} stopOpacity="0.9" />
              <stop offset="100%" stopColor={ORCH_COLORS[orch] || DEFAULT_COLOR} stopOpacity="0.6" />
            </linearGradient>
          ))}
        </defs>

        {/* 스트림 */}
        {orchPaths.map((path, i) => (
          <path
            key={data.orchs[i]}
            d={path}
            fill={`url(#grad-${i})`}
            stroke={ORCH_COLORS[data.orchs[i]] || DEFAULT_COLOR}
            strokeWidth="0.5"
            opacity="0.9"
          >
            <title>{data.orchs[i]}</title>
          </path>
        ))}

        {/* X축 라벨 */}
        {data.years.map((y, i) => (
          i % 2 === 0 && (
            <text
              key={y}
              x={xScale(i)}
              y={height - 15}
              textAnchor="middle"
              fontSize="11"
              fill="#B8863F"
              fontFamily="Inter, sans-serif"
            >
              {y}
            </text>
          )
        ))}

        {/* 범례 (우측) */}
        {data.orchs.map((orch, i) => (
          <g key={orch} transform={`translate(${width - padding.right + 10}, ${padding.top + i * 22})`}>
            <rect width="12" height="12" fill={ORCH_COLORS[orch] || DEFAULT_COLOR} rx="2" />
            <text x="18" y="10" fontSize="11" fill="#F5F1E8" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              {orch}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
