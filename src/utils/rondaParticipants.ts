// 론다 출전자 추적 — Mundial 각 스테이지 데이터 크로스레퍼런스
import mundialData from '../data/mundial_results.json';

export type AdvancementStage = 'final' | 'semifinal' | 'cuartos' | 'qualifying' | 'none';

export interface Participant {
  pareja: number;
  leader: string;
  follower: string;
  category: 'general' | 'senior' | null;
  // 예선 성적
  qualifyingRank?: number;
  qualifyingPromedio?: number;
  // 다음 스테이지 진출 여부
  advancedTo: AdvancementStage;
  // 최종 순위
  finalRank?: number;
  finalPromedio?: number;
  semifinalRank?: number;
  cuartosRank?: number;
}

interface StageCouple {
  pareja: number;
  leader: string;
  follower: string;
  promedio?: number;
  rank?: number;
  ronda?: number;
}

/** 특정 스테이지에서 커플 → { rank, promedio, ronda } 맵 생성 */
function buildStageMap(stage: any): Map<number, StageCouple & { category: 'general' | 'senior' }> {
  const map = new Map<number, StageCouple & { category: 'general' | 'senior' }>();
  if (!stage) return map;

  // 평면형: stage.couples
  if (Array.isArray(stage.couples)) {
    for (const c of stage.couples as StageCouple[]) {
      if (c.pareja === undefined) continue;
      map.set(c.pareja, { ...c, category: 'general' });
    }
  }

  // general/senior 분리형 (final)
  for (const cat of ['general', 'senior'] as const) {
    const grp = stage[cat];
    if (Array.isArray(grp?.couples)) {
      for (const c of grp.couples as StageCouple[]) {
        if (c.pareja === undefined) continue;
        map.set(c.pareja, { ...c, category: cat });
      }
    }
  }

  // groups형 (clasificatoria, cuartos)
  if (stage.groups) {
    for (const [, g] of Object.entries(stage.groups) as any) {
      if (Array.isArray(g.couples)) {
        for (const c of g.couples as StageCouple[]) {
          if (c.pareja === undefined) continue;
          map.set(c.pareja, { ...c, category: 'general' });
        }
      }
    }
  }

  return map;
}

/** 특정 연도 Mundial 데이터로 전체 참가자 진출 지도 생성 */
export function getAdvancementIndex(year: number) {
  const data = (mundialData as any)[String(year)];
  if (!data?.stages) return null;

  const stages = data.stages;
  const qualifying = buildStageMap(stages.clasificatoria || stages.qualifying || stages.eliminatoria);
  const cuartos = buildStageMap(stages.cuartos || stages.quarterfinal);
  const semifinal = buildStageMap(stages.semifinal);
  const final = buildStageMap(stages.final);

  return { qualifying, cuartos, semifinal, final };
}

/** 특정 연도 · ronda 번호의 출전자 명단을 진출 성적과 함께 반환 */
export function getParticipantsByRonda(
  year: number,
  rondaNumber: number
): Participant[] {
  const idx = getAdvancementIndex(year);
  if (!idx) return [];

  const result: Participant[] = [];
  for (const [pareja, c] of idx.qualifying) {
    if (c.ronda !== rondaNumber) continue;

    let advancedTo: AdvancementStage = 'qualifying';
    const final = idx.final.get(pareja);
    const semi = idx.semifinal.get(pareja);
    const cuartos = idx.cuartos.get(pareja);

    if (final) advancedTo = 'final';
    else if (semi) advancedTo = 'semifinal';
    else if (cuartos) advancedTo = 'cuartos';

    result.push({
      pareja,
      leader: c.leader,
      follower: c.follower,
      category: c.category,
      qualifyingRank: c.rank,
      qualifyingPromedio: c.promedio,
      advancedTo,
      finalRank: final?.rank,
      finalPromedio: final?.promedio,
      semifinalRank: semi?.rank,
      cuartosRank: cuartos?.rank,
    });
  }

  // 진출 단계 우선 정렬 (결승 → 준결승 → 8강 → 예선), 그 안에서 qualifying 순위
  const stageWeight: Record<AdvancementStage, number> = {
    final: 0, semifinal: 1, cuartos: 2, qualifying: 3, none: 4,
  };
  result.sort((a, b) => {
    const w = stageWeight[a.advancedTo] - stageWeight[b.advancedTo];
    if (w !== 0) return w;
    if (a.advancedTo === 'final' && a.finalRank && b.finalRank) return a.finalRank - b.finalRank;
    return (a.qualifyingRank ?? 999) - (b.qualifyingRank ?? 999);
  });

  return result;
}

/** 어드밴스 배지 라벨/색 */
export const ADVANCE_LABEL: Record<AdvancementStage, { label: string; short: string; color: string }> = {
  final: { label: '🏆 결승 진출', short: '결승', color: 'bg-tango-brass text-tango-ink' },
  semifinal: { label: '◆ 준결승 진출', short: '준결승', color: 'bg-tango-brass/40 text-tango-brass border border-tango-brass/60' },
  cuartos: { label: '◇ 8강 진출', short: '8강', color: 'bg-tango-brass/20 text-tango-brass border border-tango-brass/30' },
  qualifying: { label: '○ 예선 탈락', short: '예선', color: 'bg-white/5 text-tango-cream/50 border border-white/10' },
  none: { label: '—', short: '—', color: 'bg-white/5 text-tango-cream/40' },
};

/** 이 연도에 자동 진출 추적이 가능한지 */
export function hasAdvancementData(year: number): boolean {
  const data = (mundialData as any)[String(year)];
  if (!data?.stages) return false;
  const hasQual = !!(data.stages.clasificatoria || data.stages.qualifying || data.stages.eliminatoria);
  const hasFin = !!data.stages.final;
  return hasQual && hasFin;
}
