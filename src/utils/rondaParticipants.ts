// 론다 출전자 추적 — Mundial 각 스테이지 데이터 크로스레퍼런스
import mundialData from '../data/mundial_results.json';
import participants2025 from '../data/mundial_participants_2025.json';

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

/** 2025년 그룹별 ronda 정보 */
export interface RondaGroup {
  group: string;             // 'A' | 'B' | 'C' | 'D'
  date: string;              // '2025-08-23' 등
  rondaNumber: number;
  participants: Participant[];
}

/* ───── 기존 로직: 2024 이전 간단 데이터 ───── */

interface StageCouple {
  pareja: number;
  leader: string;
  follower: string;
  promedio?: number;
  rank?: number;
  ronda?: number;
}

function buildStageMap(stage: any): Map<number, StageCouple & { category: 'general' | 'senior' }> {
  const map = new Map<number, StageCouple & { category: 'general' | 'senior' }>();
  if (!stage) return map;
  if (Array.isArray(stage.couples)) {
    for (const c of stage.couples as StageCouple[]) {
      if (c.pareja === undefined) continue;
      map.set(c.pareja, { ...c, category: 'general' });
    }
  }
  for (const cat of ['general', 'senior'] as const) {
    const grp = stage[cat];
    if (Array.isArray(grp?.couples)) {
      for (const c of grp.couples as StageCouple[]) {
        if (c.pareja === undefined) continue;
        map.set(c.pareja, { ...c, category: cat });
      }
    }
  }
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

/* ───── 신규 2025 고급 매칭: tangoba.org PDF 기반 ───── */

interface ParticipantsIndexEntry {
  pareja: number;
  leader: string;
  follower: string;
  stages: Record<string, { ronda: number; rank: number; promedio: number; scores?: number[] }>;
}

const p2025 = participants2025 as unknown as {
  year: number;
  stages: Record<string, {
    stage: string;
    group: string | null;
    date: string;
    judges_count: number;
    couples: Array<{ ronda: number; pareja: number; leader: string; follower: string; scores: number[]; promedio: number; rank: number }>;
  }>;
  ronda_ranges: Record<string, number[]>;
  participants_index: Record<string, ParticipantsIndexEntry>;
};

/**
 * 2025년: 특정 ronda 번호에 해당하는 모든 그룹(A/B/C/D) 리스트
 * ronda가 같은 번호여도 Day 1 A / Day 1 B / Day 2 C / Day 2 D는 다른 세션
 */
export function getRondaGroups2025(rondaNumber: number): RondaGroup[] {
  const results: RondaGroup[] = [];
  const idx = p2025.participants_index;

  for (const groupKey of ['clasificatoria_A', 'clasificatoria_B', 'clasificatoria_C', 'clasificatoria_D']) {
    const stageData = p2025.stages[groupKey];
    if (!stageData) continue;
    const couplesInRonda = stageData.couples.filter(c => c.ronda === rondaNumber);
    if (couplesInRonda.length === 0) continue;

    const participants: Participant[] = couplesInRonda.map(c => {
      const chain = idx[String(c.pareja)];
      let advancedTo: AdvancementStage = 'qualifying';
      let finalRank, finalPromedio, semifinalRank, cuartosRank;

      if (chain?.stages.final) {
        advancedTo = 'final';
        finalRank = chain.stages.final.rank;
        finalPromedio = chain.stages.final.promedio;
      } else if (chain?.stages.semifinal) {
        advancedTo = 'semifinal';
        semifinalRank = chain.stages.semifinal.rank;
      } else if (chain?.stages.cuartos_A || chain?.stages.cuartos_B) {
        advancedTo = 'cuartos';
        cuartosRank = chain.stages.cuartos_A?.rank ?? chain.stages.cuartos_B?.rank;
      }

      return {
        pareja: c.pareja,
        leader: c.leader,
        follower: c.follower,
        category: null,
        qualifyingRank: c.rank,
        qualifyingPromedio: c.promedio,
        advancedTo,
        finalRank, finalPromedio, semifinalRank, cuartosRank,
      };
    });

    // 진출 단계 정렬
    const stageWeight: Record<AdvancementStage, number> = { final: 0, semifinal: 1, cuartos: 2, qualifying: 3, none: 4 };
    participants.sort((a, b) => {
      const w = stageWeight[a.advancedTo] - stageWeight[b.advancedTo];
      if (w !== 0) return w;
      if (a.finalRank && b.finalRank) return a.finalRank - b.finalRank;
      return (a.qualifyingRank ?? 999) - (b.qualifyingRank ?? 999);
    });

    results.push({
      group: stageData.group ?? '?',
      date: stageData.date,
      rondaNumber,
      participants,
    });
  }

  return results;
}

/**
 * 레거시 단일 매칭 (mundial_results.json 기반) — 다른 연도용
 */
export function getParticipantsByRonda(year: number, rondaNumber: number): Participant[] {
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

  const stageWeight: Record<AdvancementStage, number> = { final: 0, semifinal: 1, cuartos: 2, qualifying: 3, none: 4 };
  result.sort((a, b) => {
    const w = stageWeight[a.advancedTo] - stageWeight[b.advancedTo];
    if (w !== 0) return w;
    if (a.advancedTo === 'final' && a.finalRank && b.finalRank) return a.finalRank - b.finalRank;
    return (a.qualifyingRank ?? 999) - (b.qualifyingRank ?? 999);
  });

  return result;
}

export const ADVANCE_LABEL: Record<AdvancementStage, { label: string; short: string; color: string }> = {
  final: { label: '🏆 결승 진출', short: '결승', color: 'bg-tango-brass text-tango-ink' },
  semifinal: { label: '◆ 준결승 진출', short: '준결승', color: 'bg-tango-brass/40 text-tango-brass border border-tango-brass/60' },
  cuartos: { label: '◇ 8강 진출', short: '8강', color: 'bg-tango-brass/20 text-tango-brass border border-tango-brass/30' },
  qualifying: { label: '○ 예선 탈락', short: '예선', color: 'bg-white/5 text-tango-cream/50 border border-white/10' },
  none: { label: '—', short: '—', color: 'bg-white/5 text-tango-cream/40' },
};

export function hasAdvancementData(year: number): boolean {
  if (year === 2025) return true; // mundial_participants_2025.json
  const data = (mundialData as any)[String(year)];
  if (!data?.stages) return false;
  const hasQual = !!(data.stages.clasificatoria || data.stages.qualifying || data.stages.eliminatoria);
  const hasFin = !!data.stages.final;
  return hasQual && hasFin;
}
