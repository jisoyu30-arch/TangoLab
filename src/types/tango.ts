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
