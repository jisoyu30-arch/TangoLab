// 탱고 아카이브 타입 정의

export interface Song {
  song_id: string;
  title: string;
  alt_titles: string[];
  genre: string;
  orchestra: string | null;
  orchestra_id: string | null;
  vocalist: string | null;
  recording_date: string | null;
  composer: string | null;
  lyricist: string | null;
  mood_tags: string[];
  tempo: string | null;
  dance_notes: string | null;
  source_confidence: 'A' | 'B' | 'C' | 'D';
  evidence_note: string | null;
  competition_popularity_score: number | null;
  strategy_notes?: string; // 추가: 곡별 전략 메모
  related_video_ids?: string[]; // 추가: 관련 레퍼런스 영상
}

export interface Appearance {
  appearance_id: string;
  song_id: string;
  competition_id: string;
  year: number;
  category: string;
  stage: 'qualifying' | 'semifinal' | 'final';
  round_label: string | null;
  song_order_in_round: number | null;
  source_confidence: 'A' | 'B' | 'C' | 'D';
  evidence_note: string | null;
  source_url: string | null;
  status: string;
}

export interface Orchestra {
  orchestra_id: string;
  orchestra_name: string;
  alt_names: string[];
  active_era: string;
  style_tags: string[];
  common_competition_use_notes: string;
  key_vocalists: string[];
  representative_songs: string[];
  strategy_notes?: string; // 추가: 악단별 전략 요약
}

export interface Competition {
  competition_id: string;
  competition_name: string;
  alt_names: string[];
  organizer: string;
  country: string;
  city: string;
  official_status: string;
  notes: string;
}

export interface DanceGuide {
  song_id: string;
  summary: string;
  mood: string;
  energy: 'low' | 'medium' | 'high' | 'variable';
  rhythm_type: string;
  walk_feel: string;
  recommended_moves: string[];
  avoid_moves: string[];
  competition_tip: string;
  musical_cues: string[];
  partner_advice: string;
}

export type TrainingStatus = 'none' | 'needs_practice' | 'both_unstable' | 'confident' | 'ready';

export interface TrainingState {
  favorite: boolean;
  status: TrainingStatus;
  notes: string;
}

export interface SongRanking {
  song_id: string;
  title: string;
  orchestra: string | null;
  total_appearances: number;
  weighted_score: number;
  final_count: number;
  semifinal_count: number;
  qualifying_count: number;
  years: number[];
  competitions: string[];
}


// === MVP 확장: 연습 보드 ===

export interface PracticeBoard {
  id: string;
  title: string;
  description: string;
  song_ids: string[];
  notes: PracticeNote[];
  checkpoints: string[];
  created_at: string;
  updated_at: string;
}

export interface PracticeNote {
  id: string;
  board_id: string;
  song_id: string | null;
  content: string;
  tags: string[];
  created_at: string;
}

// === MVP 확장: 비교 연습실 ===

export interface CompareSession {
  id: string;
  title: string;
  song_id: string | null;
  reference_video_url: string;
  own_video_url: string;
  checklist: CompareCheckItem[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CompareCheckItem {
  key: string;
  label: string;
  checked: boolean;
}

// === MVP 확장: 최근 본 항목 ===

export interface RecentItem {
  type: 'song' | 'orchestra' | 'video';
  id: string;
  title: string;
  subtitle?: string;
  visited_at: string;
}

// === 수업 & 연습 기록 ===

export interface ClassRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  instructor: string;
  location: string;
  duration_minutes: number;
  topics: string[]; // ['기본축', '피보테']
  video_url: string | null; // YouTube, Instagram 등
  notes: string;
  key_takeaways: string[]; // 핵심 배운 점
  partner: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeLog {
  id: string;
  date: string; // YYYY-MM-DD
  duration_minutes: number;
  partner: string; // '신랑' | '지아님' | '혼자' 등
  focus: string[]; // ['발스', '밀롱가', 'Nueve Puntos 연습']
  notes: string;
  energy_level: 'low' | 'medium' | 'high' | null;
  created_at: string;
}

// === 우리 대회 기록 ===

export interface OwnCompetition {
  id: string;
  competition_name: string; // 'KTC 2024 Pista'
  date: string; // YYYY-MM-DD
  partner: string;
  category: string; // 'pista' | 'vals' | 'milonga' | 'escenario'
  stage: string; // 'qualifying' | 'semifinal' | 'final'
  ronda_number: number | null;
  songs: OwnCompetitionSong[]; // 그 라운드에 나온 곡
  judges: Judge[];
  scores: ScoreEntry[];
  video_url: string | null; // YouTube 등 링크
  video_note: string; // 영상 관련 메모
  result_placement: number | null; // 최종 순위
  advanced_to_next: boolean; // 다음 라운드 진출 여부
  overall_notes: string;
  strengths: string; // 잘한 점
  improvements: string; // 개선할 점
  bib_number: string | null; // 등번호
  created_at: string;
  updated_at: string;
}

export interface OwnCompetitionSong {
  title: string;
  orchestra: string;
  song_id?: string; // 탱고랩 DB에 있는 곡이면 연결
}

export interface Judge {
  name: string;
  credentials: string; // '전 Mundial 심판', '아르헨티나 출신 마에스트로' 등
}

export interface ScoreEntry {
  judge_name: string;
  criteria: ScoreCriteria;
  total: number; // 자동 계산 or 직접 입력
  notes: string; // 심사위원 코멘트
}

export interface ScoreCriteria {
  musicality: number; // 1-10
  technique: number;
  elegance: number;
  embrace: number;
  floor_navigation: number;
}

export const DEFAULT_JUDGING_CRITERIA = [
  { key: 'musicality', label: '음악성' },
  { key: 'technique', label: '테크닉' },
  { key: 'elegance', label: '우아함' },
  { key: 'embrace', label: '아브라소' },
  { key: 'floor_navigation', label: '동선/플로어크래프트' },
] as const;
