// 커플 여정 Sankey — 예선 → 준결승 → 결승 진출 흐름 시각화
import { useMemo } from 'react';
import mundialData from '../data/mundial_results.json';

interface MundialCouple {
  pareja: number;
  leader: string;
  follower: string;
  promedio: number;
  rank: number;
}

interface MundialGroup {
  couples: MundialCouple[];
}

interface StageData {
  groups?: Record<string, MundialGroup>;
  couples?: MundialCouple[];
  general?: { couples: MundialCouple[] };
  senior?: { couples: MundialCouple[] };
}

interface YearData {
  stages: Record<string, StageData>;
}

const mundial = mundialData as Record<string, YearData>;

interface Flow {
  from: string;
  to: string;
  value: number;
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  h: number;
  stage: string;
}

export function CoupleJourneySankey({ year = '2025' }: { year?: string }) {
  const { nodes, flows, total } = useMemo(() => {
    const data = mundial[year];
    if (!data) return { nodes: [], flows: [], total: 0 };

    // 각 stage별 커플 카운트
    const clasif = data.stages.clasificatoria;
    const semi = data.stages.semifinal;
    const final = data.stages.final;

    let clasifCouples: MundialCouple[] = [];
    if (clasif?.groups) {
      for (const g of Object.values(clasif.groups)) clasifCouples.push(...g.couples);
    } else if (clasif?.couples) {
      clasifCouples = clasif.couples;
    }

    let semiCouples: MundialCouple[] = [];
    if (semi?.groups) {
      for (const g of Object.values(semi.groups)) semiCouples.push(...g.couples);
    } else if (semi?.couples) {
      semiCouples = semi.couples;
    }

    let finalCouples: MundialCouple[] = [];
    if (final?.general?.couples) finalCouples = final.general.couples;
    else if (final?.couples) finalCouples = final.couples;

    const totalClasif = clasifCouples.length;
    const advancedToSemi = semiCouples.length;
    const advancedToFinal = finalCouples.length;
    const eliminatedClasif = Math.max(0, totalClasif - advancedToSemi);
    const eliminatedSemi = Math.max(0, advancedToSemi - advancedToFinal);
    const topFinal = Math.min(5, advancedToFinal);

    if (totalClasif === 0) return { nodes: [], flows: [], total: 0 };

    // Sankey 레이아웃 (간단 4단 구조)
    const W = 900, H = 340;
    const colW = (W - 200) / 3; // 4 columns, 3 spaces
    const pad = 30;

    const maxVal = totalClasif;
    const scale = (H - pad * 2) / maxVal;

    // Column positions
    const col1X = pad;
    const col2X = pad + colW;
    const col3X = pad + colW * 2;
    const col4X = pad + colW * 3;
    const nodeW = 20;

    // Column 1: Classificatoria (전체)
    const col1H = totalClasif * scale;
    const col1Y = H / 2 - col1H / 2;

    // Column 2: Semifinal split — 통과 / 탈락
    const advSemiH = advancedToSemi * scale;
    const elimClasifH = eliminatedClasif * scale;
    const col2AdvY = H / 2 - col1H / 2;
    const col2ElimY = col2AdvY + advSemiH;

    // Column 3: Final split — 통과 / 탈락
    const advFinalH = advancedToFinal * scale;
    const elimSemiH = eliminatedSemi * scale;
    const col3AdvY = col2AdvY;
    const col3ElimY = col3AdvY + advFinalH;

    // Column 4: Top finalists / rest
    const topH = topFinal * scale;
    const restH = (advancedToFinal - topFinal) * scale;
    const col4TopY = col3AdvY;
    const col4RestY = col4TopY + topH;

    const nodes: Node[] = [
      { id: 'start', label: `예선 ${totalClasif}쌍`, x: col1X, y: col1Y, h: col1H, stage: 'qualifying' },
      { id: 'adv1', label: `준결승 ${advancedToSemi}쌍`, x: col2X, y: col2AdvY, h: advSemiH, stage: 'semifinal' },
      { id: 'elim1', label: `예선 탈락 ${eliminatedClasif}쌍`, x: col2X, y: col2ElimY, h: elimClasifH, stage: 'eliminated' },
      { id: 'adv2', label: `결승 ${advancedToFinal}쌍`, x: col3X, y: col3AdvY, h: advFinalH, stage: 'final' },
      { id: 'elim2', label: `준결승 탈락 ${eliminatedSemi}쌍`, x: col3X, y: col3ElimY, h: elimSemiH, stage: 'eliminated' },
      { id: 'champion', label: `TOP 5`, x: col4X, y: col4TopY, h: topH, stage: 'champion' },
      { id: 'rest', label: `기타`, x: col4X, y: col4RestY, h: restH, stage: 'final' },
    ];

    const flows: Flow[] = [
      { from: 'start', to: 'adv1', value: advancedToSemi },
      { from: 'start', to: 'elim1', value: eliminatedClasif },
      { from: 'adv1', to: 'adv2', value: advancedToFinal },
      { from: 'adv1', to: 'elim2', value: eliminatedSemi },
      { from: 'adv2', to: 'champion', value: topFinal },
      { from: 'adv2', to: 'rest', value: Math.max(0, advancedToFinal - topFinal) },
    ];

    return { nodes, flows, total: totalClasif, nodeW };
  }, [year]);

  if (total === 0) {
    return (
      <div className="text-center py-8 text-tango-cream/50 font-serif italic">
        {year}년 대회 데이터가 없습니다
      </div>
    );
  }

  const STAGE_COLORS: Record<string, string> = {
    qualifying: '#5D7A8E',
    semifinal: '#D4AF37',
    final: '#C72C1C',
    champion: '#6B1F2E',
    eliminated: '#2A2520',
  };

  const W = 900, H = 340, nodeW = 20;

  // Curved flow path
  function flowPath(from: Node, to: Node, offsetFrom: number, offsetTo: number, value: number): string {
    const scale = H / total;
    const h = value * scale;
    const x1 = from.x + nodeW;
    const y1 = from.y + offsetFrom;
    const x2 = to.x;
    const y2 = to.y + offsetTo;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2} L ${x2} ${y2 + h} C ${mx} ${y2 + h} ${mx} ${y1 + h} ${x1} ${y1 + h} Z`;
  }

  // 각 노드에서 나가는 flow들의 누적 offset
  const outOffsets: Record<string, number> = {};
  const inOffsets: Record<string, number> = {};
  const scale = H / total;

  return (
    <div className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
            Journey · {year}
          </div>
          <h3 className="font-display italic text-xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            커플 진출 흐름
          </h3>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {total}쌍
          </div>
          <div className="text-[10px] text-tango-cream/50 font-sans">참가</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: '600px' }}>
          {/* Flows */}
          {flows.map((f, i) => {
            const from = nodes.find(n => n.id === f.from)!;
            const to = nodes.find(n => n.id === f.to)!;
            const offsetFrom = outOffsets[from.id] || 0;
            const offsetTo = inOffsets[to.id] || 0;
            outOffsets[from.id] = offsetFrom + f.value * scale;
            inOffsets[to.id] = offsetTo + f.value * scale;

            return (
              <path
                key={i}
                d={flowPath(from, to, offsetFrom, offsetTo, f.value)}
                fill={STAGE_COLORS[to.stage]}
                fillOpacity="0.4"
                stroke={STAGE_COLORS[to.stage]}
                strokeWidth="0.5"
                strokeOpacity="0.6"
              >
                <title>{from.label} → {to.label}: {f.value}쌍</title>
              </path>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => (
            <g key={n.id}>
              <rect
                x={n.x}
                y={n.y}
                width={nodeW}
                height={Math.max(4, n.h)}
                fill={STAGE_COLORS[n.stage]}
                rx="2"
              />
              <text
                x={n.x + nodeW + 6}
                y={n.y + n.h / 2 + 4}
                fontSize="11"
                fill="#F5F1E8"
                fontFamily="Cormorant Garamond, serif"
                fontStyle="italic"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-sans flex-wrap">
        <LegendItem color={STAGE_COLORS.qualifying} label="예선" />
        <LegendItem color={STAGE_COLORS.semifinal} label="준결승" />
        <LegendItem color={STAGE_COLORS.final} label="결승" />
        <LegendItem color={STAGE_COLORS.champion} label="TOP 5" />
        <LegendItem color={STAGE_COLORS.eliminated} label="탈락" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={{ background: color, opacity: 0.6 }} />
      <span className="text-tango-cream/70">{label}</span>
    </div>
  );
}
