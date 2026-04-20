// 탄다 분석 유틸리티 — 에너지, 포지션, 패턴 분석
import type { Song } from '../types/tango';

// 곡의 에너지 레벨 추정 (0-10 스케일)
export function computeSongEnergy(song: Song | undefined | null): number {
  if (!song) return 5;

  const tags = song.mood_tags || [];
  let energy = 5; // 기본값

  // mood_tags 기반
  if (tags.includes('energetic') || tags.includes('fast_tempo')) energy += 2;
  if (tags.includes('rhythmic') || tags.includes('marcato') || tags.includes('compás')) energy += 1.5;
  if (tags.includes('powerful') || tags.includes('intense')) energy += 1;
  if (tags.includes('smooth') || tags.includes('elegant')) energy -= 0.5;
  if (tags.includes('melodic') || tags.includes('lyrical')) energy -= 1;
  if (tags.includes('romantic') || tags.includes('emotional')) energy -= 1.5;
  if (tags.includes('rubato')) energy -= 1;
  if (tags.includes('playful') || tags.includes('cheerful')) energy += 0.5;
  if (tags.includes('dramatic')) energy += 0.5;

  // tempo 보정
  if (song.tempo === 'fast') energy += 1.5;
  if (song.tempo === 'slow') energy -= 1.5;

  // 악단별 기본 성향 보정 (mood_tags가 없을 때 중요)
  const orch = (song.orchestra || '').toLowerCase();
  if (orch.includes('arienzo')) energy += 1.5;
  else if (orch.includes('biagi')) energy += 1.5;
  else if (orch.includes('sarli')) energy -= 0.5;
  else if (orch.includes('pugliese')) energy += 0.3; // 드라마틱 변동
  else if (orch.includes('troilo')) energy -= 0.3;
  else if (orch.includes('caló') || orch.includes('calo')) energy -= 0.5;
  else if (orch.includes('demare')) energy -= 1;
  else if (orch.includes('laurenz')) energy -= 0.5;
  else if (orch.includes('tanturi')) energy -= 0.3;

  return Math.max(0, Math.min(10, energy));
}

// 악단명 짧게 변환
export function shortOrchestraName(orchestra: string | null | undefined): string {
  if (!orchestra) return '?';
  const o = orchestra.toLowerCase();
  if (o.includes('arienzo')) return "D'Arienzo";
  if (o.includes('di sarli') || o.includes('sarli')) return 'Di Sarli';
  if (o.includes('pugliese')) return 'Pugliese';
  if (o.includes('tanturi')) return 'Tanturi';
  if (o.includes('troilo')) return 'Troilo';
  if (o.includes('laurenz')) return 'Laurenz';
  if (o.includes('caló') || o.includes('calo')) return 'Caló';
  if (o.includes('agostino')) return "D'Agostino";
  if (o.includes('biagi')) return 'Biagi';
  if (o.includes('fresedo')) return 'Fresedo';
  if (o.includes('demare')) return 'Demare';
  if (o.includes('gobbi')) return 'Gobbi';
  if (o.includes('vargas')) return 'Vargas';
  if (o.includes('basso')) return 'Basso';
  if (o.includes('canaro')) return 'Canaro';
  if (o.includes('donato')) return 'Donato';
  if (o.includes('rodrig')) return 'Rodríguez';
  if (o.includes('morán') || o.includes('moran')) return 'Morán';
  return orchestra.split(' ')[0];
}

// 포지션별 악단 통계: "Pugliese는 몇 번 1/2/3번째 곡에 나왔나?"
export interface OrchestraPositionStats {
  orchestra: string;
  total: number;
  pos1: number;
  pos2: number;
  pos3: number;
  // 비율 (%)
  pos1Pct: number;
  pos2Pct: number;
  pos3Pct: number;
}

interface TandaLike {
  songs: Array<{ song_id: string; title: string; orchestra: string; order: number }>;
}

export function computeOrchestraPositions(tandas: TandaLike[]): OrchestraPositionStats[] {
  const stats: Record<string, { total: number; pos1: number; pos2: number; pos3: number }> = {};

  for (const t of tandas) {
    for (const s of t.songs) {
      const short = shortOrchestraName(s.orchestra);
      if (!stats[short]) stats[short] = { total: 0, pos1: 0, pos2: 0, pos3: 0 };
      stats[short].total++;
      if (s.order === 1) stats[short].pos1++;
      else if (s.order === 2) stats[short].pos2++;
      else if (s.order === 3) stats[short].pos3++;
    }
  }

  return Object.entries(stats)
    .map(([orch, s]) => ({
      orchestra: orch,
      total: s.total,
      pos1: s.pos1,
      pos2: s.pos2,
      pos3: s.pos3,
      pos1Pct: s.total > 0 ? (s.pos1 / s.total) * 100 : 0,
      pos2Pct: s.total > 0 ? (s.pos2 / s.total) * 100 : 0,
      pos3Pct: s.total > 0 ? (s.pos3 / s.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// 에너지 흐름 패턴 분류
export type EnergyPattern = 'ascending' | 'descending' | 'valley' | 'peak' | 'flat' | 'other';

export function classifyEnergyPattern(energies: number[]): EnergyPattern {
  if (energies.length < 3) return 'other';
  const [e1, e2, e3] = energies;
  const THRESHOLD = 0.8;

  const diff12 = e2 - e1;
  const diff23 = e3 - e2;

  if (Math.abs(diff12) < THRESHOLD && Math.abs(diff23) < THRESHOLD) return 'flat';
  if (diff12 > 0 && diff23 > 0) return 'ascending';  // 점점 고조
  if (diff12 < 0 && diff23 < 0) return 'descending'; // 점점 하강
  if (diff12 < 0 && diff23 > 0) return 'valley';     // V형
  if (diff12 > 0 && diff23 < 0) return 'peak';       // ^형
  return 'other';
}

export const PATTERN_LABELS: Record<EnergyPattern, { label: string; emoji: string; desc: string }> = {
  ascending: { label: '점증형', emoji: '📈', desc: '느림 → 빠름, 에너지 상승' },
  descending: { label: '점감형', emoji: '📉', desc: '빠름 → 느림, 에너지 하강' },
  valley: { label: '저점형', emoji: '🥣', desc: '빠름 → 느림 → 빠름' },
  peak: { label: '고점형', emoji: '⛰️', desc: '느림 → 빠름 → 느림' },
  flat: { label: '평탄형', emoji: '➡️', desc: '에너지 비슷하게 유지' },
  other: { label: '기타', emoji: '❓', desc: '분류 불가' },
};

// 가장 흔한 3악단 조합 분석 (이미 있음 - orchStats)
export interface OrchestraCombo {
  combo: string;      // "D'Arienzo + Di Sarli + Pugliese" (알파벳순)
  count: number;
  percentage: number;
}

export function computeOrchestraCombos(tandas: TandaLike[]): OrchestraCombo[] {
  const counts: Record<string, number> = {};
  for (const t of tandas) {
    const orchs = [...new Set(t.songs.map(s => shortOrchestraName(s.orchestra)))].sort().join(' + ');
    counts[orchs] = (counts[orchs] || 0) + 1;
  }
  const total = tandas.length;
  return Object.entries(counts)
    .map(([combo, count]) => ({ combo, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}
