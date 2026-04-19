import type { TrainingState, TrainingStatus } from '../types/tango';

const STORAGE_KEY = 'tango_training_state';

export function loadAllTrainingStates(): Record<string, TrainingState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadTrainingState(songId: string): TrainingState {
  const all = loadAllTrainingStates();
  return all[songId] ?? { favorite: false, status: 'none', notes: '' };
}

export function saveTrainingState(songId: string, state: TrainingState): void {
  const all = loadAllTrainingStates();
  all[songId] = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export const STAGE_LABELS: Record<string, string> = {
  qualifying: '예선',
  quarterfinal: '8강',
  semifinal: '준결승',
  final: '결승',
};

export const STATUS_LABELS: Record<TrainingStatus, { label: string; color: string; emoji: string }> = {
  none: { label: '미분류', color: 'text-gray-500', emoji: '⬜' },
  needs_practice: { label: '연습 필요', color: 'text-red-400', emoji: '🔴' },
  both_unstable: { label: '둘 다 불안정', color: 'text-orange-400', emoji: '🟠' },
  confident: { label: '자신 있음', color: 'text-blue-400', emoji: '🔵' },
  ready: { label: '준비 완료', color: 'text-green-400', emoji: '🟢' },
};

export function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function getCompetitionShortName(compId: string): string {
  const map: Record<string, string> = {
    'COMP-001': 'Mundial',
    'COMP-002': 'Ciudad',
    'COMP-003': '공식예선',
    'COMP-004': 'PTC',
    'COMP-005': 'KTC',
  };
  return map[compId] ?? compId;
}
