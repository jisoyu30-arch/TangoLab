// 탄다 심층 분석 섹션 — 포지션/에너지/스테이지 분석
import { useState, useMemo } from 'react';
import {
  computeSongEnergy,
  computeOrchestraPositions,
  classifyEnergyPattern,
  PATTERN_LABELS,
} from '../utils/tandaAnalysis';
import type { EnergyPattern } from '../utils/tandaAnalysis';
import songsData from '../data/songs.json';
import type { Song } from '../types/tango';

const songs = songsData as Song[];
const songMapById = new Map(songs.map(s => [s.song_id, s]));

interface Tanda {
  id: string;
  competition: string;
  year: number;
  category: string;
  stage: string;
  ronda: number;
  songs: Array<{ song_id: string; title: string; orchestra: string; order: number }>;
  videoIds: string[];
  source: 'round' | 'appearance';
}

export function TandaAnalysisSection({ tandas }: { tandas: Tanda[] }) {
  const [mode, setMode] = useState<'position' | 'energy' | 'stage'>('position');

  return (
    <div className="relative overflow-hidden rounded-2xl border border-tango-brass/20 bg-gradient-to-br from-tango-shadow via-tango-shadow to-black/60 p-5 shadow-xl">
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-tango-brass/10 blur-3xl pointer-events-none"></div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔬</span>
          <h2 className="text-lg font-bold bg-gradient-to-r from-tango-brass to-yellow-300 bg-clip-text text-transparent">
            심층 분석
          </h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">대회 탄다의 패턴·에너지·포지션 통계</p>

        <div className="flex gap-1 mb-5 bg-black/30 p-1 rounded-xl w-fit">
          <AnalysisTab active={mode === 'position'} onClick={() => setMode('position')} icon="🎼" label="악단 포지션" />
          <AnalysisTab active={mode === 'energy'} onClick={() => setMode('energy')} icon="⚡" label="에너지 패턴" />
          <AnalysisTab active={mode === 'stage'} onClick={() => setMode('stage')} icon="🏆" label="스테이지 비교" />
        </div>

        {mode === 'position' && <PositionAnalysis tandas={tandas} />}
        {mode === 'energy' && <EnergyAnalysis tandas={tandas} />}
        {mode === 'stage' && <StageComparison tandas={tandas} />}
      </div>
    </div>
  );
}

function AnalysisTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
        active
          ? 'bg-gradient-to-r from-tango-brass to-yellow-400 text-tango-shadow shadow-lg shadow-tango-brass/30'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  );
}

function PositionAnalysis({ tandas }: { tandas: Tanda[] }) {
  const stats = useMemo(() => computeOrchestraPositions(tandas), [tandas]);
  const topOrchs = stats.filter(s => s.total >= 3).slice(0, 12);

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">악단별로 1번째/2번째/3번째 곡에 배치되는 빈도</p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-white/10">
              <th className="text-left pb-2 pl-2">악단</th>
              <th className="pb-2 w-16 text-right">출현</th>
              <th className="pb-2 px-3">1번째</th>
              <th className="pb-2 px-3">2번째</th>
              <th className="pb-2 px-3">3번째</th>
            </tr>
          </thead>
          <tbody>
            {topOrchs.map(s => (
              <tr key={s.orchestra} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="py-2.5 pl-2 text-white font-medium whitespace-nowrap">{s.orchestra}</td>
                <td className="py-2.5 text-right text-tango-brass font-bold">{s.total}</td>
                <td className="py-2.5 px-2"><PosBar pct={s.pos1Pct} count={s.pos1} color="from-blue-500 to-cyan-400" /></td>
                <td className="py-2.5 px-2"><PosBar pct={s.pos2Pct} count={s.pos2} color="from-purple-500 to-pink-400" /></td>
                <td className="py-2.5 px-2"><PosBar pct={s.pos3Pct} count={s.pos3} color="from-orange-500 to-red-400" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {topOrchs.slice(0, 3).map((s, i) => {
          const dominantPos = [
            { name: '1번째', pct: s.pos1Pct },
            { name: '2번째', pct: s.pos2Pct },
            { name: '3번째', pct: s.pos3Pct },
          ].sort((a, b) => b.pct - a.pct)[0];
          return (
            <div key={s.orchestra} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500">#{i + 1}</span>
                <span className="text-sm font-semibold text-white">{s.orchestra}</span>
              </div>
              <div className="text-[11px] text-gray-400">
                주로 <span className="text-tango-brass font-semibold">{dominantPos.name} 곡</span>
                <span className="text-gray-500 ml-1">({dominantPos.pct.toFixed(0)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PosBar({ pct, count, color }: { pct: number; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-6 bg-white/5 rounded-md overflow-hidden relative min-w-[60px]">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-md transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">
          {pct > 15 ? `${pct.toFixed(0)}%` : ''}
        </span>
      </div>
      <span className="text-[10px] text-gray-500 w-6 text-right">{count}</span>
    </div>
  );
}

function EnergyAnalysis({ tandas }: { tandas: Tanda[] }) {
  const [expandedPattern, setExpandedPattern] = useState<EnergyPattern | null>(null);

  const patterns = useMemo(() => {
    const counts: Record<EnergyPattern, number> = { ascending: 0, descending: 0, valley: 0, peak: 0, flat: 0, other: 0 };
    const byPattern: Record<EnergyPattern, Array<Tanda & { energies: number[] }>> = {
      ascending: [], descending: [], valley: [], peak: [], flat: [], other: [],
    };
    const avgEnergies = [0, 0, 0];
    let validCount = 0;

    for (const t of tandas) {
      if (t.songs.length < 3) continue;
      const energies = t.songs.slice(0, 3).map(s => {
        const song = songMapById.get(s.song_id);
        return computeSongEnergy(song ?? ({ orchestra: s.orchestra } as Song));
      });
      const pattern = classifyEnergyPattern(energies);
      counts[pattern]++;
      byPattern[pattern].push({ ...t, energies });
      energies.forEach((e, i) => { avgEnergies[i] += e; });
      validCount++;
    }
    const avgPerPos = avgEnergies.map(e => validCount > 0 ? e / validCount : 0);
    return { counts, byPattern, avgPerPos, validCount };
  }, [tandas]);

  const total = patterns.validCount || 1;
  const sortedPatterns = (Object.keys(patterns.counts) as EnergyPattern[])
    .map(k => ({ key: k, count: patterns.counts[k], pct: (patterns.counts[k] / total) * 100 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-400">3곡의 에너지(빠름/느림) 흐름 패턴 분석</p>

      <div className="bg-black/40 rounded-xl p-4 border border-white/10">
        <div className="text-xs text-gray-400 mb-3">전체 평균 에너지 흐름 ({patterns.validCount}개 탄다)</div>
        <div className="relative h-32">
          {[0, 0.25, 0.5, 0.75, 1].map(y => (
            <div key={y} className="absolute left-0 right-0 border-t border-white/5" style={{ top: `${y * 100}%` }}></div>
          ))}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 100">
            <defs>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`M 50 ${100 - patterns.avgPerPos[0] * 10} Q 150 ${100 - patterns.avgPerPos[1] * 10 - 15} 250 ${100 - patterns.avgPerPos[2] * 10} L 250 100 L 50 100 Z`}
              fill="url(#energyGrad)"
            />
            <path
              d={`M 50 ${100 - patterns.avgPerPos[0] * 10} Q 150 ${100 - patterns.avgPerPos[1] * 10 - 15} 250 ${100 - patterns.avgPerPos[2] * 10}`}
              stroke="#fbbf24"
              strokeWidth="2"
              fill="none"
            />
            {[50, 150, 250].map((x, i) => (
              <circle key={i} cx={x} cy={100 - patterns.avgPerPos[i] * 10} r="4" fill="#fbbf24" />
            ))}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-around text-[10px] text-gray-500 pb-0">
            <span>1번째</span>
            <span>2번째</span>
            <span>3번째</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {patterns.avgPerPos.map((e, i) => (
            <div key={i} className="text-center bg-white/5 rounded-lg p-2">
              <div className="text-lg font-bold text-tango-brass">{e.toFixed(1)}</div>
              <div className="text-[10px] text-gray-500">{['1번째', '2번째', '3번째'][i]} 평균</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-400 mb-3">탄다 에너지 패턴 분포 · 카드 클릭 시 대표 론다 + 영상</div>
        <div className="space-y-1.5">
          {sortedPatterns.filter(p => p.count > 0).map(p => {
            const info = PATTERN_LABELS[p.key];
            const isExpanded = expandedPattern === p.key;
            // 대표 론다: 결승 > 준결승 > 예선, 영상 있는 것 우선
            const representatives = [...patterns.byPattern[p.key]]
              .sort((a, b) => {
                const stageOrder: Record<string, number> = { final: 0, semifinal: 1, quarterfinal: 2, qualifying: 3 };
                const sA = stageOrder[a.stage] ?? 4;
                const sB = stageOrder[b.stage] ?? 4;
                if (sA !== sB) return sA - sB;
                const vA = (a.videoIds?.length ?? 0) > 0 ? 0 : 1;
                const vB = (b.videoIds?.length ?? 0) > 0 ? 0 : 1;
                if (vA !== vB) return vA - vB;
                return b.year - a.year;
              })
              .slice(0, 8);
            return (
              <div key={p.key} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedPattern(isExpanded ? null : p.key)}
                  className="w-full text-left p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.emoji}</span>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                          {info.label}
                          <span className="text-[10px] text-tango-brass/80">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500">{info.desc}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-tango-brass">{p.count}개</div>
                      <div className="text-[10px] text-gray-500">{p.pct.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-tango-brass to-yellow-300 rounded-full transition-all duration-700"
                      style={{ width: `${p.pct}%` }} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/10 p-3 bg-black/20 space-y-2">
                    <div className="text-[10px] text-tango-brass uppercase tracking-widest mb-2">
                      대표 론다 TOP {representatives.length} · 결승/영상 있는 것 우선
                    </div>
                    {representatives.map(r => {
                      const firstVidId = r.videoIds?.[0];
                      const stageLabel = r.stage === 'final' ? '🏆 결승' : r.stage === 'semifinal' ? '◆ 준결승' : r.stage === 'quarterfinal' ? '◇ 8강' : '○ 예선';
                      return (
                        <div key={r.id} className="bg-white/5 border border-white/10 rounded-sm p-2.5">
                          <div className="flex items-baseline justify-between mb-1.5 gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-tango-brass font-semibold mr-2">{stageLabel}</span>
                              <span className="text-xs text-white font-medium">{r.competition} {r.year}</span>
                              {r.ronda > 0 && <span className="text-[10px] text-gray-500 ml-1">R{r.ronda}</span>}
                            </div>
                            <div className="flex gap-1 text-[9px] text-tango-cream/60 font-mono">
                              <span>{r.energies[0].toFixed(1)}→</span>
                              <span>{r.energies[1].toFixed(1)}→</span>
                              <span className="text-tango-brass">{r.energies[2].toFixed(1)}</span>
                            </div>
                          </div>
                          {/* 곡 리스트 */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {r.songs.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[10px] bg-black/30 rounded-sm px-1.5 py-0.5 text-gray-300">
                                {s.title} <span className="text-gray-500">· {(s.orchestra || '').split(' ').slice(0, 2).join(' ')}</span>
                              </span>
                            ))}
                          </div>
                          {/* 영상 재생 버튼 */}
                          {firstVidId && (
                            <a
                              href={`https://www.youtube.com/watch?v=${firstVidId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-tango-brass/20 hover:bg-tango-brass/30 text-tango-brass rounded-sm px-2 py-1"
                            >
                              ▶ 영상 보기
                            </a>
                          )}
                          {!firstVidId && (
                            <span className="text-[9px] text-tango-cream/40">영상 없음</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StageComparison({ tandas }: { tandas: Tanda[] }) {
  const byStage = useMemo(() => {
    const groups: Record<string, Tanda[]> = { final: [], semifinal: [], qualifying: [], quarterfinal: [] };
    for (const t of tandas) {
      if (groups[t.stage]) groups[t.stage].push(t);
    }
    return groups;
  }, [tandas]);

  const stages = [
    { key: 'final', label: '결승', color: 'from-red-500 to-orange-400' },
    { key: 'semifinal', label: '준결승', color: 'from-orange-500 to-yellow-400' },
    { key: 'quarterfinal', label: '8강', color: 'from-yellow-500 to-lime-400' },
    { key: 'qualifying', label: '예선', color: 'from-blue-500 to-cyan-400' },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">스테이지별로 어떤 악단이 더 많이 선택되는지 비교</p>

      {stages.filter(s => byStage[s.key]?.length > 0).map(stage => {
        const stageTandas = byStage[stage.key];
        const orchPos = computeOrchestraPositions(stageTandas);
        const topOrchs = orchPos.slice(0, 6);

        return (
          <div key={stage.key} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-6 rounded-full bg-gradient-to-b ${stage.color}`}></div>
                <h4 className="text-sm font-bold text-white">{stage.label}</h4>
                <span className="text-xs text-gray-500">({stageTandas.length}개 탄다)</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {topOrchs.map(o => (
                <div key={o.orchestra} className="bg-black/30 rounded-lg px-3 py-1.5 border border-white/5">
                  <span className="text-xs text-white font-medium">{o.orchestra}</span>
                  <span className="text-xs text-tango-brass ml-2 font-bold">{o.total}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
