// 영상 타입 분류 — 대회 분석을 위한 perf/music 구분
// 퍼포먼스 영상(실제 대회 춤) 우선, 음악 전용은 보조

export type VideoType = 'performance' | 'music' | 'mixed' | 'unknown';

export interface VideoMeta {
  video_id: string;
  url: string;
  channel: string;
  title: string;
  type?: VideoType;
}

// 채널별 기본 타입 매핑
const CHANNEL_TYPE: Record<string, VideoType> = {
  'AiresDeMilonga': 'performance',          // 실제 Mundial/대회 영상
  'Jose Valverde': 'performance',            // Cuartos de Final
  'Cachotango': 'performance',               // 대회 영상
  'Korea Tango Cooperative': 'performance',  // KTC/PTC 실제 대회
  'Tango Mafia': 'performance',              // KTC Milonga 등
  'Mundial de Tango': 'performance',         // 공식 채널
  'Epitone Jin': 'performance',              // KTC 대회
  'TangoCafe': 'performance',                // TDAC 대회
  'TANGLE': 'performance',                   // TDAC
  '한선우': 'performance',                     // PTC 결승 풀버전
  'Thanh Dang': 'music',                     // 곡만 모은 영상 (no dance)
  'Tango Master': 'music',                   // 곡 설명 영상
};

const CHANNEL_LABEL: Record<string, string> = {
  'AiresDeMilonga': '🎥 실제 대회',
  'Jose Valverde': '🎥 실제 대회',
  'Cachotango': '🎥 실제 대회',
  'Korea Tango Cooperative': '🎥 실제 대회',
  'Tango Mafia': '🎥 실제 대회',
  'Mundial de Tango': '🎥 공식 대회',
  'Epitone Jin': '🎥 실제 대회',
  'TangoCafe': '🎥 실제 대회',
  'TANGLE': '🎥 실제 대회',
  '한선우': '🎥 실제 대회',
  'Thanh Dang': '🎵 곡 전용',
  'Tango Master': '🎵 곡 설명',
};

export function classifyVideo(v: { channel?: string; type?: VideoType }): VideoType {
  if (v.type) return v.type;
  if (!v.channel) return 'unknown';
  return CHANNEL_TYPE[v.channel] || 'unknown';
}

export function videoChannelLabel(channel: string): string {
  return CHANNEL_LABEL[channel] || channel;
}

export function isPerformanceVideo(v: { channel?: string; type?: VideoType }): boolean {
  return classifyVideo(v) === 'performance';
}

export function isMusicVideo(v: { channel?: string; type?: VideoType }): boolean {
  return classifyVideo(v) === 'music';
}

/**
 * 영상 배열을 우선순위대로 정렬: performance → unknown → music
 */
export function sortVideosByPriority<T extends { channel?: string; type?: VideoType }>(videos: T[]): T[] {
  const priority: Record<VideoType, number> = {
    performance: 0,
    mixed: 1,
    unknown: 2,
    music: 3,
  };
  return [...videos].sort((a, b) => priority[classifyVideo(a)] - priority[classifyVideo(b)]);
}

export const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  performance: '실제 대회 영상',
  music: '음악 전용 (퍼포먼스 없음)',
  mixed: '혼합 (일부 퍼포먼스)',
  unknown: '미분류',
};

export const VIDEO_TYPE_COLORS: Record<VideoType, string> = {
  performance: 'bg-tango-brass/20 text-tango-brass border-tango-brass/40',
  music: 'bg-tango-cream/10 text-tango-cream/60 border-tango-cream/20',
  mixed: 'bg-tango-rose/20 text-tango-rose border-tango-rose/40',
  unknown: 'bg-tango-shadow border-tango-brass/20 text-tango-cream/50',
};
