// 심사위원 전략 분석 — Mundial 결승 스코어 기반
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import mundialData from '../data/mundial_results.json';

interface Couple {
  pareja: number;
  leader: string;
  follower: string;
  scores: Record<string, number>;
  promedio: number;
  rank: number;
}

interface JudgeStats {
  name: string;
  appearances: Array<{ year: number; stage: string; group?: string }>;
  years: number[];
  stages: string[];
  finalYears: number[];
  totalFinalScores: number;
  avgScore: number; // 이 심사위원 평균 점수
  harshness: number; // 패널 평균 대비 (음수=더 짠, 양수=더 후)
  winnerTopPick: number; // 우승자에게 결승 중 최상위 점수를 준 횟수
  winnerAlignRate: number; // 우승자 점수가 자기 평균 top-3에 든 비율
}

function computeJudgeStats(): JudgeStats[] {
  const map = new Map<string, {
    appearances: Array<{ year: number; stage: string; group?: string }>;
    years: Set<number>;
    stages: Set<string>;
    finalYears: Set<number>;
    allScores: number[];
    panelAvgs: number[]; // 각 결승에서의 패널 평균 (이 심사위원이 참여한)
    winnerTopPicks: number;
    winnerAligns: number;
    finalParticipations: number;
  }>();

  const data = mundialData as any;

  for (const [yearStr, yearData] of Object.entries(data)) {
    const year = parseInt(yearStr);
    const stages = (yearData as any).stages;
    if (!stages) continue;

    for (const [stageName, stage] of Object.entries(stages) as any) {
      // 예선/준결승 그룹형
      if (stage.groups) {
        for (const [gName, group] of Object.entries(stage.groups) as any) {
          for (const name of (group.judges || [])) {
            const clean = (name as string).trim();
            if (!clean) continue;
            if (!map.has(clean)) map.set(clean, {
              appearances: [], years: new Set(), stages: new Set(), finalYears: new Set(),
              allScores: [], panelAvgs: [], winnerTopPicks: 0, winnerAligns: 0, finalParticipations: 0,
            });
            const j = map.get(clean)!;
            j.appearances.push({ year, stage: stageName, group: gName });
            j.years.add(year);
            j.stages.add(stageName);
          }
        }
      }
      // 결승 평면형 — 스코어 분석
      if (stage.judges && stageName === 'final') {
        for (const name of stage.judges) {
          const clean = (name as string).trim();
          if (!clean) continue;
          if (!map.has(clean)) map.set(clean, {
            appearances: [], years: new Set(), stages: new Set(), finalYears: new Set(),
            allScores: [], panelAvgs: [], winnerTopPicks: 0, winnerAligns: 0, finalParticipations: 0,
          });
          const j = map.get(clean)!;
          j.appearances.push({ year, stage: stageName });
          j.years.add(year);
          j.stages.add(stageName);
          j.finalYears.add(year);
          j.finalParticipations++;
        }

        // 스코어 수집 (general/senior 모두)
        const buckets = ['general', 'senior'] as const;
        for (const bucket of buckets) {
          const grp = stage[bucket];
          if (!grp?.couples) continue;
          const couples = grp.couples as Couple[];
          const winner = couples.find(c => c.rank === 1);
          if (!winner) continue;

          // 각 커플의 점수를 심사위원별로 수집
          const judgeScores: Record<string, number[]> = {};
          for (const c of couples) {
            for (const [jName, score] of Object.entries(c.scores)) {
              const clean = jName.trim();
              if (!judgeScores[clean]) judgeScores[clean] = [];
              judgeScores[clean].push(score);
            }
          }

          // 판정 통계
          for (const [jName, scores] of Object.entries(judgeScores)) {
            if (!map.has(jName)) continue;
            const j = map.get(jName)!;
            j.allScores.push(...scores);
            const panelAvg = scores.reduce((a, b) => a + b, 0) / scores.length;
            j.panelAvgs.push(panelAvg);

            // 우승자에 대한 이 심사위원 점수
            const winnerScore = winner.scores[jName];
            if (winnerScore !== undefined) {
              // 이 심사위원이 우승자에게 최상위 점수를 준 경우
              const sortedScores = [...scores].sort((a, b) => b - a);
              const topScore = sortedScores[0];
              if (winnerScore >= topScore - 0.05) j.winnerTopPicks++;
              // 우승자 점수가 이 심사위원 top-3 안에 드는지
              if (sortedScores.slice(0, 3).some(s => Math.abs(s - winnerScore) < 0.05)) j.winnerAligns++;
            }
          }
        }
      }
    }
  }

  const result: JudgeStats[] = [];
  for (const [name, d] of map) {
    const avgScore = d.allScores.length > 0 ? d.allScores.reduce((a, b) => a + b, 0) / d.allScores.length : 0;
    const panelAvg = d.panelAvgs.length > 0 ? d.panelAvgs.reduce((a, b) => a + b, 0) / d.panelAvgs.length : 0;
    const harshness = avgScore - panelAvg;
    const winnerAlignRate = d.finalParticipations > 0 ? d.winnerAligns / d.finalParticipations : 0;
    result.push({
      name,
      appearances: d.appearances,
      years: Array.from(d.years).sort(),
      stages: Array.from(d.stages),
      finalYears: Array.from(d.finalYears).sort(),
      totalFinalScores: d.allScores.length,
      avgScore,
      harshness,
      winnerTopPick: d.winnerTopPicks,
      winnerAlignRate,
    });
  }
  return result.sort((a, b) => b.appearances.length - a.appearances.length);
}

type SortKey = 'appearances' | 'avg' | 'harsh' | 'align';

// 심사위원 성향 분류
type Tendency = '관대형' | '엄격형' | '균형형' | '정합형' | '독립형' | '신규';

function classifyTendency(j: JudgeStats): { label: Tendency; color: string; desc: string } {
  if (j.totalFinalScores < 10) return { label: '신규', color: '#8B7A4F', desc: '결승 데이터 부족' };
  if (j.winnerAlignRate >= 0.7) return { label: '정합형', color: '#D4AF37', desc: '우승자에게 일관되게 높은 점수' };
  if (j.harshness >= 0.15) return { label: '관대형', color: '#7A9E6E', desc: '패널 평균보다 후한 점수' };
  if (j.harshness <= -0.15) return { label: '엄격형', color: '#C72C1C', desc: '패널 평균보다 짠 점수' };
  if (j.winnerAlignRate <= 0.4) return { label: '독립형', color: '#5D7A8E', desc: '우승자와 무관한 독자 평가' };
  return { label: '균형형', color: '#B0936F', desc: '평균에 가까운 안정 평가' };
}

export function JudgesPage() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('appearances');
  const [selected, setSelected] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const judges = useMemo(() => computeJudgeStats(), []);

  // 연도별 결승 패널
  const finalPanelsByYear = useMemo(() => {
    const byYear: Record<number, string[]> = {};
    const data = mundialData as any;
    for (const [yearStr, yearData] of Object.entries(data)) {
      const year = parseInt(yearStr);
      const final = (yearData as any).stages?.final;
      if (final?.judges) byYear[year] = final.judges;
    }
    return byYear;
  }, []);

  const availableYears = useMemo(() => Object.keys(finalPanelsByYear).map(Number).sort(), [finalPanelsByYear]);

  const sorted = useMemo(() => {
    let base = [...judges];
    if (yearFilter) {
      const panel = finalPanelsByYear[yearFilter] || [];
      const set = new Set(panel.map(n => n.trim()));
      base = base.filter(j => set.has(j.name));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter(j => j.name.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'avg': return base.sort((a, b) => b.avgScore - a.avgScore);
      case 'harsh': return base.sort((a, b) => a.avgScore - b.avgScore); // 낮은 평균 = 짠
      case 'align': return base.sort((a, b) => b.winnerAlignRate - a.winnerAlignRate);
      default: return base.sort((a, b) => b.appearances.length - a.appearances.length);
    }
  }, [judges, query, sortBy, yearFilter, finalPanelsByYear]);

  const selectedJudge = selected ? judges.find(j => j.name === selected) : null;

  // 최상위 인사이트 계산
  const insights = useMemo(() => {
    const finalists = judges.filter(j => j.totalFinalScores >= 20);
    const harshest = [...finalists].sort((a, b) => a.avgScore - b.avgScore)[0];
    const mostGenerous = [...finalists].sort((a, b) => b.avgScore - a.avgScore)[0];
    const mostAligned = [...finalists].sort((a, b) => b.winnerAlignRate - a.winnerAlignRate)[0];
    const mostActive = [...judges].sort((a, b) => b.appearances.length - a.appearances.length)[0];
    return { harshest, mostGenerous, mostAligned, mostActive };
  }, [judges]);

  return (
    <>
      <PageHeader title="심사위원 전략" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-10">

          {/* HERO */}
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Panel Intelligence · Mundial Judges
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              <em className="text-tango-brass">심사</em>위원단 전략 분석
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              Mundial 역대 결승 스코어 기반 · 심사위원 {judges.length}명 분석
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 🎯 핵심 인사이트 4카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {insights.mostActive && (
              <InsightCard
                label="최다 출현"
                name={insights.mostActive.name}
                value={`${insights.mostActive.appearances.length}회`}
                caption={`${insights.mostActive.years[0]}–${insights.mostActive.years[insights.mostActive.years.length - 1]}`}
                onClick={() => setSelected(insights.mostActive.name)}
              />
            )}
            {insights.harshest && (
              <InsightCard
                label="가장 짠 심사"
                name={insights.harshest.name}
                value={insights.harshest.avgScore.toFixed(2)}
                caption={`평균 ${insights.harshest.harshness.toFixed(2)}`}
                onClick={() => setSelected(insights.harshest.name)}
                accent="cold"
              />
            )}
            {insights.mostGenerous && (
              <InsightCard
                label="가장 후한 심사"
                name={insights.mostGenerous.name}
                value={insights.mostGenerous.avgScore.toFixed(2)}
                caption={`+${insights.mostGenerous.harshness.toFixed(2)}`}
                onClick={() => setSelected(insights.mostGenerous.name)}
                accent="warm"
              />
            )}
            {insights.mostAligned && (
              <InsightCard
                label="우승자 정합도 1위"
                name={insights.mostAligned.name}
                value={`${Math.round(insights.mostAligned.winnerAlignRate * 100)}%`}
                caption="우승자에게 top-3 점수"
                onClick={() => setSelected(insights.mostAligned.name)}
                accent="gold"
              />
            )}
          </div>

          {/* 연도별 결승 패널 선택 */}
          <div className="bg-white/5 border border-tango-brass/15 rounded-sm p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Final Panels · 연도별 결승 심사위원단
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setYearFilter(null)}
                className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                  yearFilter === null ? 'border-tango-brass bg-tango-brass/15 text-tango-brass' : 'border-white/10 text-tango-cream/60 hover:border-tango-brass/40'
                }`}
              >
                전체
              </button>
              {availableYears.map(y => (
                <button
                  key={y}
                  onClick={() => setYearFilter(y)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                    yearFilter === y ? 'border-tango-brass bg-tango-brass/15 text-tango-brass' : 'border-white/10 text-tango-cream/60 hover:border-tango-brass/40'
                  }`}
                >
                  Mundial {y} 결승
                </button>
              ))}
            </div>
            {yearFilter && finalPanelsByYear[yearFilter] && (
              <div className="mt-3 pt-3 border-t border-tango-brass/15 text-xs text-tango-cream/80 font-sans">
                {finalPanelsByYear[yearFilter].join(' · ')}
              </div>
            )}
          </div>

          {/* 검색 + 정렬 */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tango-brass">◈</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="심사위원 이름 검색…"
                className="w-full bg-transparent border-0 border-b-2 border-tango-brass/30 focus:border-tango-brass pb-2 pt-1 pl-8 font-serif text-lg text-tango-paper placeholder-tango-cream/30 focus:outline-none"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { k: 'appearances', label: '출현순' },
                { k: 'avg', label: '평균점수' },
                { k: 'harsh', label: '가혹도' },
                { k: 'align', label: '우승정합' },
              ].map(o => (
                <button
                  key={o.k}
                  onClick={() => setSortBy(o.k as SortKey)}
                  className={`text-xs px-3 py-1.5 rounded-sm border transition-colors ${
                    sortBy === o.k ? 'border-tango-brass bg-tango-brass/15 text-tango-brass' : 'border-white/10 text-tango-cream/60 hover:border-tango-brass/40'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2열 레이아웃: 목록 + 상세 */}
          <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
            {/* 목록 */}
            <div className="space-y-0 max-h-[70vh] overflow-y-auto pr-2">
              {sorted.map((j, i) => (
                <button
                  key={j.name}
                  onClick={() => setSelected(j.name)}
                  className={`w-full grid grid-cols-[40px_1fr_auto] items-baseline gap-3 py-3 px-3 -mx-3 text-left border-b border-tango-brass/10 transition-colors ${
                    selected === j.name ? 'bg-tango-brass/10 border-tango-brass/40' : 'hover:bg-tango-brass/5'
                  }`}
                >
                  <span className="font-display text-lg text-tango-brass/40 italic leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="font-serif italic text-base text-tango-paper truncate flex items-center gap-1.5" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {j.name}
                      {(() => {
                        const t = classifyTendency(j);
                        return (
                          <span
                            className="text-[9px] tracking-widest uppercase font-sans px-1.5 py-0.5 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: `${t.color}25`, color: t.color }}
                            title={t.desc}
                          >
                            {t.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mt-0.5">
                      {j.finalYears.length > 0 ? `결승 ${j.finalYears.length}회` : j.stages.join(' / ')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {sortBy === 'avg' || sortBy === 'harsh' ? (
                      <div className="font-display text-base text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {j.avgScore > 0 ? j.avgScore.toFixed(2) : '—'}
                      </div>
                    ) : sortBy === 'align' ? (
                      <div className="font-display text-base text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {j.totalFinalScores > 0 ? `${Math.round(j.winnerAlignRate * 100)}%` : '—'}
                      </div>
                    ) : (
                      <div className="font-display text-base text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {j.appearances.length}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 상세 패널 */}
            <div>
              {selectedJudge ? <JudgeDetail judge={selectedJudge} /> : (
                <div className="border border-dashed border-tango-brass/20 rounded-sm p-10 text-center">
                  <p className="text-tango-cream/50 font-serif italic text-sm" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    심사위원을 선택하면 전략 분석이 나타납니다
                  </p>
                </div>
              )}
            </div>
          </div>

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}

function InsightCard({ label, name, value, caption, onClick, accent }: {
  label: string; name: string; value: string; caption: string; onClick: () => void;
  accent?: 'cold' | 'warm' | 'gold';
}) {
  const accentClass = accent === 'gold' ? 'border-tango-brass/50 bg-tango-brass/10'
    : accent === 'cold' ? 'border-blue-400/30 bg-blue-400/5'
    : accent === 'warm' ? 'border-orange-400/30 bg-orange-400/5'
    : 'border-tango-brass/25 bg-white/5';
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-sm border p-4 hover:bg-tango-brass/10 transition-colors ${accentClass}`}
    >
      <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-1">{label}</div>
      <div className="font-display text-2xl text-tango-brass mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {value}
      </div>
      <div className="text-sm text-tango-paper font-serif italic truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
        {name}
      </div>
      <div className="text-[10px] text-tango-cream/50 mt-1">{caption}</div>
    </button>
  );
}

function JudgeDetail({ judge }: { judge: JudgeStats }) {
  // 연도별 출현 빈도
  const yearCounts: Record<number, number> = {};
  for (const a of judge.appearances) {
    yearCounts[a.year] = (yearCounts[a.year] ?? 0) + 1;
  }

  // 전략적 해석
  let verdict = '';
  if (judge.totalFinalScores >= 20) {
    if (judge.harshness < -0.1 && judge.winnerAlignRate >= 0.5) {
      verdict = '짠 기준이지만 우승자를 확실히 알아봄. 기본기와 정통성에 가중치.';
    } else if (judge.harshness < -0.1) {
      verdict = '전반적으로 짠 점수. 완성도보다 디테일 감점형.';
    } else if (judge.harshness > 0.1 && judge.winnerAlignRate >= 0.5) {
      verdict = '후한 편이지만 우승자 식별력 높음. 표현력·에너지 가중치.';
    } else if (judge.harshness > 0.1) {
      verdict = '후한 편. 전반적으로 관대한 기준.';
    } else if (judge.winnerAlignRate >= 0.6) {
      verdict = '패널 평균과 가깝지만 우승자 판독력이 매우 높음. 코어 심사위원.';
    } else {
      verdict = '평균적인 기준으로 판정.';
    }
  } else if (judge.finalYears.length > 0) {
    verdict = '결승 경험 적음. 샘플이 많아지면 패턴 드러날 것.';
  } else {
    verdict = '예선·준결승 전담. 결승 진출 판정에 영향.';
  }

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="border-l-2 border-tango-brass pl-4">
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
          Judge Profile
        </div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="font-display text-3xl italic text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {judge.name}
          </h2>
          {(() => {
            const t = classifyTendency(judge);
            return (
              <span
                className="text-[10px] tracking-[0.2em] uppercase font-sans px-2 py-1 rounded-sm"
                style={{ backgroundColor: `${t.color}25`, color: t.color }}
                title={t.desc}
              >
                {t.label} · {t.desc}
              </span>
            );
          })()}
        </div>
        <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mt-1">
          {judge.years[0]}–{judge.years[judge.years.length - 1]} · {judge.appearances.length}회 심사
        </div>
      </div>

      {/* 전략 verdict */}
      <div className="bg-gradient-to-br from-tango-brass/10 via-tango-shadow to-tango-ink rounded-sm border border-tango-brass/25 p-5">
        <div className="text-[10px] tracking-widest uppercase text-tango-brass font-sans mb-2">
          Strategic Read
        </div>
        <p className="font-serif italic text-base text-tango-paper/90 leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
          {verdict}
        </p>
      </div>

      {/* 핵심 스탯 */}
      {judge.totalFinalScores > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="결승 샘플" value={`${judge.totalFinalScores}`} caption="커플 × 해" />
          <StatBox label="평균 점수" value={judge.avgScore.toFixed(2)} caption={`${judge.harshness > 0 ? '+' : ''}${judge.harshness.toFixed(2)} vs 패널`} />
          <StatBox label="우승자 Top-1" value={`${judge.winnerTopPick}`} caption="최고점 부여 횟수" />
          <StatBox label="우승 정합도" value={`${Math.round(judge.winnerAlignRate * 100)}%`} caption="우승자=자기 top-3" accent />
        </div>
      )}

      {/* 연도별 활동 */}
      <div>
        <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-2">
          연도별 활동
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(yearCounts).sort((a, b) => Number(a[0]) - Number(b[0])).map(([y, c]) => (
            <div key={y} className={`text-xs px-3 py-1.5 rounded-sm border ${
              judge.finalYears.includes(Number(y)) ? 'border-tango-brass/50 bg-tango-brass/10 text-tango-brass' : 'border-white/10 text-tango-cream/60'
            }`}>
              {y} · {c}회
              {judge.finalYears.includes(Number(y)) && <span className="ml-1">★</span>}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-tango-cream/40 mt-2 font-sans">★ 결승 패널 참여 연도</div>
      </div>

      {/* 스테이지 분포 */}
      <div>
        <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-2">
          심사 스테이지
        </div>
        <div className="flex gap-2 flex-wrap">
          {judge.stages.map(s => (
            <span key={s} className="text-[11px] px-2 py-1 rounded-sm border border-tango-brass/30 text-tango-cream/80">
              {s === 'final' ? '결승' : s === 'semifinal' ? '준결승' : s === 'qualifying' ? '예선' : s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, caption, accent }: { label: string; value: string; caption: string; accent?: boolean }) {
  return (
    <div className={`rounded-sm border p-3 ${accent ? 'border-tango-brass/40 bg-tango-brass/5' : 'border-tango-brass/15 bg-white/5'}`}>
      <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-1">{label}</div>
      <div className={`font-display text-xl ${accent ? 'text-tango-brass' : 'text-tango-paper'}`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {value}
      </div>
      <div className="text-[10px] text-tango-cream/40 mt-0.5">{caption}</div>
    </div>
  );
}
