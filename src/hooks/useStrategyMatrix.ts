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

// 음악 분류 × 차원별 기본 가이드 — 작가님이 직접 수정/보강 가능
export const CELL_GUIDES: Record<string, { headline: string; points: string[] }> = {
  // ───── 리드믹 (D'Arienzo / Biagi / Tanturi) ─────
  'rhythmic:walk': {
    headline: '또렷한 마르카토 — 비트마다 발끝',
    points: [
      '발끝으로 박자를 정확히 찍기, 뒤꿈치 내림은 절제',
      '무게 이동을 짧고 분명하게 — 끌림 없이',
      '비트와 비트 사이에 멈춤 없는 또렷한 워킹',
      '몸통은 단단히, 다리만 분리하여 박자 표현',
    ],
  },
  'rhythmic:embrace': {
    headline: '단단하고 닫힌 아브라소 — 가슴 정렬 또렷',
    points: [
      '클로즈드 아브라소 유지, 거리감 변동 최소화',
      '가슴 정렬은 정면, 흐트러지지 않게',
      '호흡은 짧고 분절적 — 비트와 함께',
      '리더 가슴이 박자 신호를 분명히 전달',
    ],
  },
  'rhythmic:sequence': {
    headline: '짧은 단위 반복 — 8박 안에 매듭',
    points: [
      '8박 단위로 끊어지는 시퀀스 (corte 활용)',
      'Traspié(트라스피에)·옴브로(ombro) 같은 분절 동작',
      '복잡한 컴비네이션보다 정확한 박자 단위 반복',
      '짧은 사카다·옥시오 단위로 빠르게 회전',
    ],
  },
  'rhythmic:calesita': {
    headline: '리더의 걸음이 박자에 정확 — 팔로워 축 단단히',
    points: [
      '팔로워는 한 발 축, 리더가 그 주위를 걷는 figura',
      '리더의 발걸음 하나하나가 비트와 정확히 일치',
      '팔로워 축은 흔들림 없음, 무게는 한 발에 단단히',
      '팔로워는 다른 발로 짧은 타파다(tapada)·picado adornos',
    ],
  },
  'rhythmic:variation': {
    headline: '곡 후반 휘몰아치는 박자 — 칼처럼 정확한 빠른 히로·오초',
    points: [
      '바리아시옹 = 곡 클라이맥스의 빠른 하이라이트 구간',
      '비트를 한 박자도 놓치지 않는 정확한 빠른 히로(giro)',
      '오초·트라스피에를 박자에 칼같이 맞춰 분리',
      'Picado(짧고 또렷한 발놀림)로 비트 강조 — 흐트러짐 0',
    ],
  },

  // ───── 멜로디컬 (Di Sarli / Calo / Fresedo) ─────
  'melodic:walk': {
    headline: '길게 끌기 — 음악 라인을 다리로 그리기',
    points: [
      '발바닥 전체로 길게 끌기, 발끝만 찍지 않기',
      '음표가 길면 다리도 길게, 끊지 않기',
      '무게 이동을 천천히 — 음표 길이만큼',
      '몸통도 함께 흐르게, 분리감 줄이기',
    ],
  },
  'melodic:embrace': {
    headline: '부드럽고 흐르는 아브라소 — 호흡 길게',
    points: [
      '아브라소를 살짝 풀었다 모이는 호흡 변화',
      '가슴은 부드럽게 연결, 거리감을 곡선처럼',
      '호흡은 길고 깊게 — 음악 페이즈에 맞춰',
      '팔로워 등에 닿는 손은 안내자처럼 부드럽게',
    ],
  },
  'melodic:sequence': {
    headline: '긴 호흡 시퀀스 — 끊김 없는 회전',
    points: [
      '8박을 넘어가는 긴 헤다(giro) 시퀀스',
      '사카다는 부드럽게 — 칼처럼 자르지 않기',
      'Boleo는 길게 흘러, 멜로디 라인 따라가기',
      '시퀀스 사이를 walking으로 자연스럽게 이음',
    ],
  },
  'melodic:calesita': {
    headline: '느린 카레시따 — 리더가 음표 따라 길게 걷기',
    points: [
      '팔로워가 축, 리더가 천천히 큰 원을 그리며 걷는다',
      '리더의 발걸음은 음표 길이 — 끌듯이 길게',
      '팔로워는 안정된 축 위에서 부드러운 호흡',
      '음악 라인에 따라 원의 크기 변화 — 안쪽으로 작게, 다시 크게',
    ],
  },
  'melodic:variation': {
    headline: '빠른 구간도 부드럽게 — 흐르는 빠른 히로',
    points: [
      '바리아시옹의 빠른 박자에도 끊김 없이 연결',
      '빠른 히로·오초를 칼처럼 자르지 않고 곡선으로',
      '발은 빠르지만 몸통과 아브라소는 부드럽게',
      '강조는 라인의 길이로 — 음악 절정에서 길게 늘이기',
    ],
  },

  // ───── 쇼 탱고 (Show Tango) ─────
  'show:walk': {
    headline: '큰 보폭 — 표현적 무게 중심',
    points: [
      '보폭을 크게, 바깥 라인까지 사용',
      '몸통 라인을 길게 펼쳐 시각적 인상',
      '무게 중심 이동을 의도적으로 보이게',
      '시선·턱 라인까지 표현 요소로 활용',
    ],
  },
  'show:embrace': {
    headline: '열림과 닫힘 의도적 변화',
    points: [
      '열린 아브라소 허용 — 거리감을 표현 도구로',
      '닫혔다 열리는 변화로 드라마 만들기',
      '시선 처리 적극 — 관객/심사 라인 의식',
      '아브라소 깨졌다 다시 모이는 순간을 강조',
    ],
  },
  'show:sequence': {
    headline: '화려한 컴비네이션 — 대담하게',
    points: [
      '하이 볼레오·간초·아도르노 적극 사용',
      '컴비네이션 길게, 인상적인 finishing',
      '리프트는 안전 범위 내에서 단 한 번 임팩트',
      '시퀀스 끝에 시선 처리로 마무리',
    ],
  },
  'show:calesita': {
    headline: '드라마틱 카레시따 — 팔로워가 중심, 리더가 둘러싸기',
    points: [
      '팔로워 축 위에서 화려한 adornos·planeo',
      '리더가 큰 원을 그리며 시각적으로 둘러싸는 동선',
      '스피드 변화로 긴장감 — 리더 걸음이 빨라졌다 느려지기',
      '카레시따 마무리에 명확한 finishing pose',
    ],
  },
  'show:variation': {
    headline: '곡 절정 빠른 구간 — 임팩트 큰 빠른 동작',
    points: [
      '바리아시옹을 무대 클라이맥스로 활용',
      '하이 볼레오·하이 히로·점프 같은 큰 동작',
      '음악이 휘몰아치는 정점에 가장 큰 동작 배치',
      '여러 작은 동작보다 한 번의 강한 정점',
    ],
  },

  // ───── 트래디셔널 (Tango de Salón — 부에노스아이레스 밀롱가의 본 모습) ─────
  // 아르헨티나 댄서들은 "트래디셔널"이라는 라벨을 잘 쓰지 않음.
  // 황금기 밀롱게로들은 그냥 "Tango de Salón" — 밀롱가에서 실제 추는 탱고 그 자체.
  'traditional:walk': {
    headline: 'La Caminata — 걷기가 곧 당신의 탱고다',
    points: [
      '"모든 동작은 걷기에서 나온다" — 시퀀스 화려함보다 발의 질',
      '무릎 부드럽게 굽힘, 위아래 흔들림 0',
      '발바닥 전체 안정적으로 — 끌듯이, 누르듯이',
      '몸통 차분, 다리만 정확히 — 변형 자제',
    ],
  },
  'traditional:embrace': {
    headline: 'Apilado — 명치까지 겹친 하나의 축',
    points: [
      '두 사람 가슴이 solar plexus(명치)부터 겹쳐 한 축처럼',
      '발은 살짝 떨어져 있어도 가슴은 떨어지지 않음',
      '회전(giro)에서만 잠깐 풀렸다 다시 모임',
      '아브라소 자체가 곡 전체의 그라운드 — 변하지 않는 토대',
    ],
  },
  'traditional:sequence': {
    headline: '"No bailás los pasos, bailás la música" — 음악을 춘다',
    points: [
      '스텝을 추는 게 아니라 음악과 대화하는 것',
      '단순하지만 음악과 정확히 맞물린 figura',
      '사카다·옥시오 정석대로, 변형 자제',
      '컴비네이션 길이보다 매 동작 완성도',
    ],
  },
  'traditional:calesita': {
    headline: '클래식 카레시따 — 안정된 축, 정통 figura',
    points: [
      '팔로워가 한 발 축, 리더가 그 주위를 정통 워킹으로 걷기',
      '원은 작게, 가속·과시 없이 안정',
      '팔로워의 단단한 축이 모든 것의 토대',
      '카레시따 후 자연스러운 워킹으로 흘러나가는 마무리',
    ],
  },
  'traditional:variation': {
    headline: '곡의 빠른 하이라이트 — 절제된 빠른 히로·오초',
    points: [
      '바리아시옹 = 곡 클라이맥스의 빠른 구간 (Pugliese에 한정 안 됨)',
      '빠른 박자 위에서도 정통 라인 유지 — 동작이 음악 위로 뜨지 않게',
      '히로·오초를 빠르지만 단단하게, 변형 자제',
      'Pugliese yumba·arrastre 곡에서는 호흡 길게 늘이기',
    ],
  },
};

// 프레이즈 / 대회준비반 노트의 시작 가이드
export const PHRASING_GUIDE = `프레이즈 = 음악적 한 호흡 단위
- 8박 단위가 기본 (보통 4박 + 4박)
- 프레이즈 시작에서 무게 잡고, 끝에서 마무리(corte/cierre)
- 두 프레이즈가 묶여 16박 = 한 단락 → 단락 끝에서 더 큰 마무리
- 음악 들으며 호흡점(쉼표) 찾기 → 그 자리에 카레시따·정지·시퀀스 끝맺음 배치`;

export const PREP_CLASS_GUIDE = `대회준비반 핵심 — 작가님이 채워주실 영역
예: 강사 코멘트, 자주 지적받는 부분, 우리만의 약속, 레퍼런스 영상 모음, 의상/외형 결정사항…`;

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
