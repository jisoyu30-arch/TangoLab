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

// 음악 분류 × 차원별 기본 가이드 — 영문/스페인어권 출처 기반
// 출처는 각 셀의 sources 배열 참고 (Tejas Tango, Tangology 101, Ultimate Tango, Endre Tango, Tango Voice 등)
export interface CellGuide {
  headline: string;
  points: string[];
  sources?: { label: string; url: string }[];
}

export const CELL_GUIDES: Record<string, CellGuide> = {
  // ───── 리드믹 (D'Arienzo / Biagi / Tanturi) ─────
  // D'Arienzo = "El Rey del Compás" (King of the Beat). Marcato in 4 + sub-pulse 강조.
  'rhythmic:walk': {
    headline: '단단하고 일정한 마치(march) — solid steady march forward',
    points: [
      'Tangology 101: "solid, steady march forward that was clear and easy to interpret"',
      '드라이브가 분명한 워킹 — 피아노의 강한 비트와 반도네온의 choppy 사운드에 맞춰 행진하듯',
      '리듬은 ONE-and-TWO-and-THREE-and-FOUR — sub-pulse(and)도 활용 가능',
      '몸통 안정, 다리만 분리해 박자 표현',
    ],
    sources: [
      { label: 'Tangology 101 — Juan d\'Arienzo', url: 'http://www.tangology101.com/main.cfm/title/Juan-d\'Arienzo/id/62' },
      { label: 'Ignacio Varchausky — D\'Arienzo Course', url: 'https://www.ignaciovarchausky.com/curso-d\'arienzo-english' },
    ],
  },
  'rhythmic:embrace': {
    headline: '가슴-가슴 클로즈 — 작은 리드믹 즉흥 동작',
    points: [
      'Tangology 101: "close chest-to-chest connection, executing tiny, rhythmic, and improvised movements"',
      '클로즈 아브라소 유지 — 박자 신호를 가슴으로 정확히 전달',
      '거리감 변동 최소, 두 사람 가슴 정렬을 흐트리지 않음',
      '큰 figura보다 작고 빠른 즉흥 동작이 어울림',
    ],
    sources: [
      { label: 'Tangology 101 — Juan d\'Arienzo', url: 'http://www.tangology101.com/main.cfm/title/Juan-d\'Arienzo/id/62' },
    ],
  },
  'rhythmic:sequence': {
    headline: '작은 즉흥 동작 + traspié·sub-pulse 활용',
    points: [
      'Tango Inside Out: D\'Arienzo의 강한 sub-pulse 덕분에 댄서들은 "ands"(반박자)도 적극 사용',
      '큰 컴비네이션보다 짧은 단위 반복 — 박자가 워낙 분명해서 정확도가 곧 인상',
      'Traspié(트라스피에) 같은 분절 동작이 sub-pulse를 시각화',
      '작은 사카다·짧은 오초로 비트 위에 즉흥 추가',
    ],
    sources: [
      { label: 'Tango Inside Out — D\'Arienzo Music Talks', url: 'http://www.tangoinsideout.com/darienzo-music-talks/' },
    ],
  },
  'rhythmic:calesita': {
    headline: '리더의 걸음이 비트와 정확히 일치 — 팔로워 축 단단히',
    points: [
      'Ultimate Tango (Calecita): "leader walks around partner while keeping her pivoting on her supporting leg"',
      '리더 발걸음 거리가 일정해야 팔로워 축이 흐트러지지 않음 (consistency in step length is crucial)',
      'D\'Arienzo의 강한 비트에 리더 걸음 하나하나가 정확히 맞물림',
      '팔로워는 자유 다리로 짧고 또렷한 adornos (picado 계열)',
    ],
    sources: [
      { label: 'Ultimate Tango — Calecita', url: 'https://www.ultimatetango.com/blog/all-you-need-to-know-about-calecita' },
      { label: 'Endre Tango — Calesita', url: 'https://endretango.com/en/calesita-a-step-everyone-uses-but-no-one-knows-its-name-intermediate/' },
    ],
  },
  'rhythmic:variation': {
    headline: '빠른 클라이맥스 구간 — sub-pulse 활용한 정확한 빠른 figura',
    points: [
      'D\'Arienzo의 변주 구간은 sub-pulse가 더욱 분명 → 빠른 히로/오초의 박자 정확도가 인상',
      'Tango-Space: 빠른 히로는 어깨 회전과 임펄스를 더 빠르게, dissociation을 짧은 타이밍에',
      '"ands" 박자 위에 짧은 액센트 동작 분리',
      'Picado(짧고 또렷한 발놀림)로 비트 강조 — 흐트러짐 0',
    ],
    sources: [
      { label: 'Tango-Space — Faster giros', url: 'http://www.tango-space.com/technique/changing-dynamics-dance-slower-faster-giros/' },
      { label: 'Tango Inside Out — D\'Arienzo', url: 'http://www.tangoinsideout.com/darienzo-music-talks/' },
    ],
  },

  // ───── 멜로디컬 (Di Sarli / Calo / Fresedo) ─────
  // Di Sarli — smooth, lyrical, elegant pauses. Salon dancers의 favorite.
  'melodic:walk': {
    headline: '걷고 멈추기 — Walk and elegant pause',
    points: [
      'Tangology 101: "Dancing to di Sarli, you\'ll walk and you\'ll stop, making elegant pauses"',
      '드라마틱한 템포 변화 없는, 흐르는 걸음 — smooth flowing arrangements',
      '음악 페이즈 끝에서 우아한 정지(pausa)',
      '몸통도 함께 흐르게, 분리감 줄이기',
    ],
    sources: [
      { label: 'Tangology 101 — Carlos di Sarli', url: 'http://www.tangology101.com/main.cfm/title/Carlos-di-Sarli/id/60' },
      { label: 'TangoEvents AU — Di Sarli', url: 'https://tangoevents.au/carlos-di-sarli-the-maestro-of-tangos-golden-age/' },
    ],
  },
  'melodic:embrace': {
    headline: 'Salon embrace — 살롱 스타일, 오초/히로에 살짝 열림',
    points: [
      'Di Sarli의 우아하고 서정적인 음악은 Tango de Salón 댄서의 favorite',
      'Tango Voice: 살롱(Villa Urquiza) 스타일은 클로즈 유지하되 ocho/giro 때 살짝 열림',
      '두 사람 사이 살짝의 V-shape — 정교한 풋워크와 우아한 leg sweep 가능',
      '연결감은 가슴-몸통-팔 모두 통해 부드럽게 전달',
    ],
    sources: [
      { label: 'Tango Voice — Embrace variations', url: 'https://tangovoice.wordpress.com/2014/05/20/variations-in-the-tango-embrace-open-embrace-and-close-embrace-styles-of-tango-the-evidence-from-buenos-aires-milongas/' },
      { label: 'Tango Mentor — Close embrace', url: 'https://tangomentor.com/dancing-in-close-embrace/' },
    ],
  },
  'melodic:sequence': {
    headline: '명료한 프레이즈 표현 — 우아하게, 미묘하게',
    points: [
      'El Portal del Tango: "beautiful melodies, clear phrasing, and subtle nuances, allowing dancers to express themselves with grace"',
      '드라마틱한 액센트 대신 흐르는 컴포지션 — 동작도 끊지 않기',
      '8박 안에 가두지 말고 음악 프레이즈에 맞춰 길게 호흡',
      '오초·히로·사카다를 칼처럼 자르지 않고 곡선으로',
    ],
    sources: [
      { label: 'El Portal del Tango — Di Sarli', url: 'https://elportaldeltango.com/carlos-di-sarli/' },
    ],
  },
  'melodic:calesita': {
    headline: '느린 카레시따 — 리더의 긴 걸음, 팔로워의 우아한 축',
    points: [
      'Ultimate Tango: 칼레시따 = 리더가 팔로워 주위를 걷고 팔로워는 축 발에 pivot',
      'Di Sarli 음악의 "elegant pause" 성격에 맞춰 리더 걸음을 천천히 길게',
      '팔로워는 자유 다리로 우아한 adornos·planeo (느긋한 footwork)',
      '음악 프레이즈에 맞춰 원의 속도 변화',
    ],
    sources: [
      { label: 'Ultimate Tango — Calecita', url: 'https://www.ultimatetango.com/blog/all-you-need-to-know-about-calecita' },
    ],
  },
  'melodic:variation': {
    headline: '빠른 구간 — 임펄스를 키우되 부드러움 유지',
    points: [
      'Tango-Space: 빠른 히로는 임펄스·dissociation 속도를 늘리되 연결감은 유지',
      'Di Sarli의 변주는 보통 절제된 편 — 격렬함보다 라인의 길이로 강조',
      '발은 빠르지만 몸통과 아브라소는 흐르게',
      '음악 절정에서 길게 늘어지는 동작',
    ],
    sources: [
      { label: 'Tango-Space — Faster giros', url: 'http://www.tango-space.com/technique/changing-dynamics-dance-slower-faster-giros/' },
    ],
  },

  // ───── 쇼 탱고 (Tango Escenario / Stage Tango) ─────
  // ⚠ 주의: Mundial Pista 규정상 점프(saltos), 두 발 떨어짐, 트레파다 등 escenario 요소는 금지.
  // 이 섹션은 escenario 카테고리 출전 또는 musical interpretation의 극적 순간 활용 참고용.
  'show:walk': {
    headline: '"La línea" — 길게 뻗는 시각적 라인',
    points: [
      'Hispanic Outlook: "perfect la línea — the beautiful, extended line of the body that creates a stunning silhouette"',
      'Sydney Tango Collective: "intricate routines, strong lines, emphasis on technical skills"',
      '댄서는 동시에 예술가 + 운동선수 — 정밀도, 힘, 유연성 모두 훈련',
      '시선·턱 라인까지 표현 요소로 활용',
    ],
    sources: [
      { label: 'Hispanic Outlook — Stage Tango', url: 'https://www.hispanicoutlook.com/articles/stage-tango-style-has-reached-world' },
      { label: 'Sydney Tango Collective — Stage vs Salon', url: 'https://sydneytangocollective.com.au/2025/06/02/stage-tango-and-tango-salon-what-is-the-difference/' },
    ],
  },
  'show:embrace': {
    headline: 'Open embrace — 분리와 재연결을 표현 도구로',
    points: [
      'Tango Voice: "open embrace with exaggerated movements"',
      'Sydney Tango Collective: "separate and do large leg swings and poses, dancing apart from each other"',
      '클로즈/오픈 의도적 전환 — 분리 자체가 드라마틱한 액션',
      '관객/심사 라인 의식한 시선 처리',
    ],
    sources: [
      { label: 'Tango Voice — Stage Tango', url: 'https://tangovoice.wordpress.com/2010/04/14/stage-tango-show-tango-exhibition-tango-tango-fantasia-tango-for-export/' },
      { label: 'Sydney Tango Collective', url: 'https://sydneytangocollective.com.au/2025/06/02/stage-tango-and-tango-salon-what-is-the-difference/' },
    ],
  },
  'show:sequence': {
    headline: '극적 안무 — 발레 요소, 대담한 line',
    points: [
      'Tango Voice: "elements often taken from ballet that are not part of social tango vocabulary"',
      '하이 볼레오, 큰 leg swing, 포즈 — 사회적 탱고에 없는 동작',
      '⚠ Mundial Pista 규정: 점프(saltos), 트레파다(climbs), 두 발 떠는 동작 모두 금지 — Escenario 한정',
      '컴비네이션은 길고, finishing pose 명확',
    ],
    sources: [
      { label: 'Tango Voice — Stage Tango', url: 'https://tangovoice.wordpress.com/2010/04/14/stage-tango-show-tango-exhibition-tango-tango-fantasia-tango-for-export/' },
      { label: 'US Argentine Tango Championship Rules', url: 'https://tangousachampionship.com/info-rules/' },
    ],
  },
  'show:calesita': {
    headline: '드라마틱 카레시따 — 팔로워 spotlight, 리더의 시각적 둘러싸기',
    points: [
      'Ultimate Tango: 팔로워가 축에서 자유 다리로 footwork·body movement 표현 가능',
      '쇼에서는 그 spotlight 시간을 적극 활용 — planeo, hi-adornos',
      '리더 동선을 크게 그려 시각적 둘러싸기',
      '카레시따 마무리에 명확한 finishing pose',
    ],
    sources: [
      { label: 'Ultimate Tango — Calecita', url: 'https://www.ultimatetango.com/blog/all-you-need-to-know-about-calecita' },
    ],
  },
  'show:variation': {
    headline: '곡 절정 = 무대 클라이맥스, 큰 임팩트 동작',
    points: [
      '바리아시옹의 빠른 박자를 무대 정점으로 활용',
      '⚠ Pista 출전 시: 점프·하이 볼레오 등은 금지 → 빠른 히로·오초를 정확하게',
      'Escenario 출전 시: 점프, 하이 볼레오, hi-giro 등 ballet-influenced 동작',
      '음악이 휘몰아치는 정점에 가장 큰 동작 배치',
    ],
    sources: [
      { label: 'Hispanic Outlook — Stage Tango', url: 'https://www.hispanicoutlook.com/articles/stage-tango-style-has-reached-world' },
      { label: 'US Argentine Tango Championship Rules', url: 'https://tangousachampionship.com/info-rules/' },
    ],
  },

  // ───── 트래디셔널 (Tango de Salón / Pugliese / Troilo) ─────
  // 아르헨티나에서는 "트래디셔널"보다 그냥 "Tango de Salón" — 밀롱가에서 실제 추는 탱고.
  // Pugliese의 yumba beat (1/3박 강조 + 2/4박 약하게)는 트래디셔널 음악의 대표 sound 중 하나.
  'traditional:walk': {
    headline: 'La Caminata — 모든 동작은 걷기에서',
    points: [
      'Tejas Tango / Tango Apilado: "all tango steps originate from the walk; one must master walking before complex moves"',
      'Wikipedia: 황금기 댄서들은 모든 스타일을 그냥 "Tango de Salón"이라 불렀음 (Christine Denniston)',
      '무릎 부드럽게, 위아래 흔들림 0 — 정통 마일롱게로 워킹',
      '몸통 차분, 다리만 정확히 — 변형 자제',
    ],
    sources: [
      { label: 'Tejas Tango — Styles', url: 'https://www.tejastango.com/tango_styles.html' },
      { label: 'Tango Apilado — Milonguero', url: 'https://www.tangoapilado.com/home/' },
      { label: 'Wikipedia — Argentine Tango', url: 'https://en.wikipedia.org/wiki/Argentine_tango' },
    ],
  },
  'traditional:embrace': {
    headline: 'Apilado — 명치(solar plexus)까지 겹친 하나의 축',
    points: [
      'Tejas Tango: "joins torsos through the solar plexus to create a merged axis"',
      'Tango Voice: 클로즈 아브라소가 처음부터 끝까지 유지되는 것이 milonguero/traditional의 핵심',
      '발은 살짝 떨어져 있어도 가슴은 떨어지지 않음',
      '아브라소가 곡 전체의 그라운드 — 변하지 않는 토대',
    ],
    sources: [
      { label: 'Tejas Tango — Styles', url: 'https://www.tejastango.com/tango_styles.html' },
      { label: 'Siempre Milonguero', url: 'https://www.siempremilonguero.org/milonguero-style-tango/' },
      { label: 'Tango Voice — Embrace', url: 'https://tangovoice.wordpress.com/2014/05/20/variations-in-the-tango-embrace-open-embrace-and-close-embrace-styles-of-tango-the-evidence-from-buenos-aires-milongas/' },
    ],
  },
  'traditional:sequence': {
    headline: '음악과의 conversation — 단순하지만 정확',
    points: [
      'Tejas Tango: Tango de Salón은 "small intricate movements creating a conversation between the dancers"',
      'Pugliese의 음악은 "rhythmic and melodic energies at once" → 두 에너지를 한 시퀀스 안에서',
      '사카다·오초 정석대로, 변형 자제',
      '컴비네이션 길이보다 매 동작의 완성도',
    ],
    sources: [
      { label: 'Tejas Tango — Styles', url: 'https://www.tejastango.com/tango_styles.html' },
      { label: 'Tangology 101 — Pugliese', url: 'https://tangology101.com/main.cfm/id/63' },
      { label: 'Marcelo Solis — La Yumba', url: 'https://escuelatangoba.com/marcelosolis/argentine-tango-music-la-yumba-osvaldo-pugliese/' },
    ],
  },
  'traditional:calesita': {
    headline: '클래식 카레시따 — 안정된 축, 정통 figura',
    points: [
      'Ultimate Tango: 카레시따 = 리더가 팔로워를 한 발 위에 lift한 채 그 주위를 걷기',
      'Endre Tango: 리더 step length의 일관성이 매끄러운 카레시따의 핵심',
      'Pugliese의 walking beat은 강력 → 카레시따 안정감과 잘 맞물림',
      '원은 작게, 가속·과시 없이 안정 — 마무리는 자연스러운 워킹으로 흘러나감',
    ],
    sources: [
      { label: 'Ultimate Tango — Calecita', url: 'https://www.ultimatetango.com/blog/all-you-need-to-know-about-calecita' },
      { label: 'Endre Tango — Calesita', url: 'https://endretango.com/en/calesita-a-step-everyone-uses-but-no-one-knows-its-name-intermediate/' },
    ],
  },
  'traditional:variation': {
    headline: '곡 클라이맥스 빠른 구간 — 정통 라인 유지하며 빠른 figura',
    points: [
      'Tangology 101: Pugliese는 "rhythmic and melodic energies at once" — 변주 구간에서 둘 다 나타남',
      'La Yumba 분석: "sharp rítmico motives and lyrical cantando lines" 교차',
      '빠른 박자 위에서도 정통 라인 유지 — 동작이 음악 위로 뜨지 않게',
      'Pugliese의 yumba/arrastre 곡에서는 호흡 길게 늘이기 (1/3박 강조)',
    ],
    sources: [
      { label: 'Tangology 101 — Pugliese', url: 'https://tangology101.com/main.cfm/id/63' },
      { label: 'Wikipedia — La Yumba', url: 'https://en.wikipedia.org/wiki/La_yumba' },
      { label: 'Marcelo Solis — La Yumba', url: 'https://escuelatangoba.com/marcelosolis/argentine-tango-music-la-yumba-osvaldo-pugliese/' },
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
