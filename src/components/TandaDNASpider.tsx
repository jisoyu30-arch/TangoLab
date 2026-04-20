// Tanda DNA 스파이더 — 5축 레이더 차트 (에너지/템포분산/시대/보컬비율/인기도)
import { useMemo } from 'react';
import { computeSongEnergy } from '../utils/tandaAnalysis';
import type { Song } from '../types/tango';

interface Props {
  songs: Array<{ song_id: string; title: string; orchestra: string; order: number }>;
  songMap: Map<string, Song>;
  size?: number;
}

export function TandaDNASpider({ songs, songMap, size = 200 }: Props) {
  const axes = useMemo(() => {
    if (songs.length === 0) return null;

    const fullSongs = songs.map(s => songMap.get(s.song_id)).filter(Boolean) as Song[];

    // 1. 평균 에너지 (0-10 → 0-100%)
    const energies = fullSongs.map(s => computeSongEnergy(s));
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / Math.max(1, energies.length);

    // 2. 에너지 분산 (편차 → 대비도)
    const meanE = avgEnergy;
    const variance = energies.reduce((sum, e) => sum + Math.pow(e - meanE, 2), 0) / Math.max(1, energies.length);
    const stdDev = Math.sqrt(variance);

    // 3. 시대 (평균 녹음 연도 1920-1955 → 0-100%)
    const recordingYears = fullSongs
      .map(s => s.recording_date ? parseInt(s.recording_date) : null)
      .filter((y): y is number => y !== null && !isNaN(y));
    const avgYear = recordingYears.length > 0
      ? recordingYears.reduce((a, b) => a + b, 0) / recordingYears.length
      : 1942;
    const eraScore = Math.max(0, Math.min(1, (avgYear - 1920) / 35));

    // 4. 보컬 비율 (0=전부 인스트루멘탈, 1=전부 보컬)
    const vocalRatio = fullSongs.filter(s => s.vocalist).length / Math.max(1, fullSongs.length);

    // 5. 인기도 (평균 competition_popularity_score 0-10)
    const popularities = fullSongs.map(s => s.competition_popularity_score ?? 1);
    const avgPopularity = popularities.reduce((a, b) => a + b, 0) / Math.max(1, popularities.length);

    return {
      energy: avgEnergy / 10,           // 0-1
      contrast: Math.min(1, stdDev / 4), // 0-1
      era: eraScore,                     // 0-1
      vocal: vocalRatio,                 // 0-1
      popularity: Math.min(1, avgPopularity / 10), // 0-1
    };
  }, [songs, songMap]);

  if (!axes) return null;

  const LABELS = ['에너지', '대비', '시대', '보컬', '인기'];
  const values = [axes.energy, axes.contrast, axes.era, axes.vocal, axes.popularity];
  const n = LABELS.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 30;

  // 각 축 좌표
  const angle = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const point = (i: number, v: number) => ({
    x: cx + Math.cos(angle(i)) * r * v,
    y: cy + Math.sin(angle(i)) * r * v,
  });
  const labelPoint = (i: number) => ({
    x: cx + Math.cos(angle(i)) * (r + 18),
    y: cy + Math.sin(angle(i)) * (r + 18),
  });

  const dataPath = values.map((v, i) => {
    const p = point(i, v);
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ') + ' Z';

  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 동심원 */}
        {[0.2, 0.4, 0.6, 0.8, 1].map(frac => (
          <polygon
            key={frac}
            points={Array.from({ length: n }, (_, i) => {
              const p = point(i, frac);
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none"
            stroke="#B8863F"
            strokeOpacity={frac === 1 ? 0.3 : 0.1}
            strokeWidth="1"
          />
        ))}

        {/* 축 */}
        {Array.from({ length: n }, (_, i) => {
          const p = point(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#B8863F"
              strokeOpacity="0.15"
              strokeWidth="1"
            />
          );
        })}

        {/* 데이터 폴리곤 */}
        <path
          d={dataPath}
          fill="#B8863F"
          fillOpacity="0.25"
          stroke="#B8863F"
          strokeWidth="1.5"
        />

        {/* 데이터 포인트 */}
        {values.map((v, i) => {
          const p = point(i, v);
          return <circle key={i} cx={p.x} cy={p.y} r="3" fill="#D4AF37" />;
        })}

        {/* 라벨 */}
        {LABELS.map((l, i) => {
          const p = labelPoint(i);
          return (
            <text
              key={l}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="#F5F1E8"
              fontFamily="Cormorant Garamond, serif"
              fontStyle="italic"
            >
              {l}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
