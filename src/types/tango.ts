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
