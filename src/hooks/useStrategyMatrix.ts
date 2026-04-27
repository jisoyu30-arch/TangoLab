// 대회 전략 매트릭스 — 음악 분류 4 × 차원 5 = 20개 셀 + 메모/영상
import { useState, useEffect, useCallback } from 'react';

export type MusicType = 'rhythmic' | 'melodic' | 'show' | 'traditional';
export type Dimension = 'walk' | 'embrace' | 'sequence' | 'calesita' | 'variation';

export const MUSIC_TYPES: { key: MusicType; label: string; sub: string; color: string }[] = [
  { key: 'rhythmic',    label: '리드믹',     sub: 'Rítmico',     color: '#C72C1C' },
  { key: 'melodic',     label: '멜로디컬',   sub: 'Melódico',    color: '#5D7A8E' },
  { key: 'show',        label: '쇼 탱고',    sub: 'Show Tango',  color: '#D4AF37' },
  { key: 'traditional', label: '트래디셔널', sub: 'Tradicional', color: '#7A8E6E' },
];

export const DIMENSIONS: { key: Dimension; label: string; icon: string; desc: string }[] = [
  { key: 'walk',      label: '걷기 질감',   icon: '🚶', desc: '음악에 맞는 걸음의 질감' },
  { key: 'embrace',   label: '아브라소',    icon: '🤝', desc: '아브라소 강도와 거리감' },
  { key: 'sequence',  label: '우리 시퀀스', icon: '◈',  desc: '음악 듣자마자 꺼낼 시그니처 시퀀스' },
  { key: 'calesita',  label: '칼래시따',    icon: '⟲',  desc: '회전·정체 패턴' },
  { key: 'variation', label: '바리아시옹',  icon: '⚡', desc: '음악 클라이맥스 대응' },
];

export interface VideoRef {
  id: string;
  url: string;
  label?: string;       // 메모: '결승 1라운드 0:34 발 위치' 등
  added_at: string;
}

export interface MatrixCell {
  notes: string;
  reference_videos?: VideoRef[]; // 참고 레퍼런스 (우승자/마에스트로 영상)
  own_videos?: VideoRef[];        // 우리 연습 영상
  checklist?: { id: string; text: string; done: boolean }[];
  updated_at?: string;
}

export interface StrategyMatrix {
  cells: Record<string, MatrixCell>; // key = `${musicType}:${dimension}`
  phrasing_notes: string;            // 프레이즈 구별하기 메모
  prep_class_notes: string;          // 대회준비반 핵심 메모
  custom_categories: { key: string; label: string; notes: string }[];
}

const STORAGE_KEY = 'tango_lab_strategy_matrix';

const initial: StrategyMatrix = {
  cells: {},
  phrasing_notes: '',
  prep_class_notes: '',
  custom_categories: [],
};

function load(): StrategyMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw);
    return {
      cells: parsed.cells || {},
      phrasing_notes: parsed.phrasing_notes || '',
      prep_class_notes: parsed.prep_class_notes || '',
      custom_categories: parsed.custom_categories || [],
    };
  } catch {
    return initial;
  }
}

function save(data: StrategyMatrix) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function cellKey(music: MusicType, dim: Dimension): string {
  return `${music}:${dim}`;
}

export function useStrategyMatrix() {
  const [data, setData] = useState<StrategyMatrix>(load);

  // 다른 탭에서 수정 감지
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setData(load());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateCell = useCallback((music: MusicType, dim: Dimension, patch: Partial<MatrixCell>) => {
    setData(prev => {
      const k = cellKey(music, dim);
      const existing = prev.cells[k] || { notes: '' };
      const next = {
        ...prev,
        cells: {
          ...prev.cells,
          [k]: { ...existing, ...patch, updated_at: new Date().toISOString() },
        },
      };
      save(next);
      return next;
    });
  }, []);

  const addVideo = useCallback((
    music: MusicType,
    dim: Dimension,
    kind: 'reference' | 'own',
    url: string,
    label?: string
  ) => {
    setData(prev => {
      const k = cellKey(music, dim);
      const existing = prev.cells[k] || { notes: '' };
      const newVideo: VideoRef = {
        id: `vid-${Date.now()}`,
        url: url.trim(),
        label: label?.trim(),
        added_at: new Date().toISOString(),
      };
      const field = kind === 'reference' ? 'reference_videos' : 'own_videos';
      const next = {
        ...prev,
        cells: {
          ...prev.cells,
          [k]: {
            ...existing,
            [field]: [...(existing[field] || []), newVideo],
            updated_at: new Date().toISOString(),
          },
        },
      };
      save(next);
      return next;
    });
  }, []);

  const removeVideo = useCallback((
    music: MusicType,
    dim: Dimension,
    kind: 'reference' | 'own',
    videoId: string
  ) => {
    setData(prev => {
      const k = cellKey(music, dim);
      const existing = prev.cells[k];
      if (!existing) return prev;
      const field = kind === 'reference' ? 'reference_videos' : 'own_videos';
      const next = {
        ...prev,
        cells: {
          ...prev.cells,
          [k]: {
            ...existing,
            [field]: (existing[field] || []).filter((v: VideoRef) => v.id !== videoId),
            updated_at: new Date().toISOString(),
          },
        },
      };
      save(next);
      return next;
    });
  }, []);

  const updatePhrasing = useCallback((text: string) => {
    setData(prev => {
      const next = { ...prev, phrasing_notes: text };
      save(next);
      return next;
    });
  }, []);

  const updatePrepClass = useCallback((text: string) => {
    setData(prev => {
      const next = { ...prev, prep_class_notes: text };
      save(next);
      return next;
    });
  }, []);

  const addCustomCategory = useCallback((label: string) => {
    setData(prev => {
      const next = {
        ...prev,
        custom_categories: [...prev.custom_categories, {
          key: `custom-${Date.now()}`,
          label,
          notes: '',
        }],
      };
      save(next);
      return next;
    });
  }, []);

  const updateCustomCategory = useCallback((key: string, patch: { label?: string; notes?: string }) => {
    setData(prev => {
      const next = {
        ...prev,
        custom_categories: prev.custom_categories.map(c => c.key === key ? { ...c, ...patch } : c),
      };
      save(next);
      return next;
    });
  }, []);

  const removeCustomCategory = useCallback((key: string) => {
    setData(prev => {
      const next = {
        ...prev,
        custom_categories: prev.custom_categories.filter(c => c.key !== key),
      };
      save(next);
      return next;
    });
  }, []);

  // 진행률 (메모 또는 영상이 있는 셀 비율)
  const filledCount = Object.values(data.cells).filter(c =>
    c.notes.trim() || (c.reference_videos?.length || 0) > 0 || (c.own_videos?.length || 0) > 0
  ).length;
  const totalCells = MUSIC_TYPES.length * DIMENSIONS.length; // 20

  return {
    data,
    updateCell,
    addVideo,
    removeVideo,
    updatePhrasing,
    updatePrepClass,
    addCustomCategory,
    updateCustomCategory,
    removeCustomCategory,
    filledCount,
    totalCells,
    progress: totalCells > 0 ? filledCount / totalCells : 0,
  };
}

// YouTube/Instagram 영상 ID 추출
export function extractVideoEmbed(url: string): { type: 'youtube' | 'instagram' | 'other'; id?: string; embedUrl?: string } {
  if (!url) return { type: 'other' };
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) {
    return {
      type: 'youtube',
      id: yt[1],
      embedUrl: `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`,
    };
  }
  // Instagram
  const ig = url.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/);
  if (ig) {
    return {
      type: 'instagram',
      id: ig[1],
      embedUrl: `https://www.instagram.com/p/${ig[1]}/embed`,
    };
  }
  return { type: 'other' };
}
