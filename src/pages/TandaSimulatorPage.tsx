// 탄다 시뮬레이터 — 내 탄다를 Mundial 데이터로 평가
import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import songsData from '../data/songs.json';
import roundsData from '../data/competition_rounds.json';
import { isPerformanceVideo } from '../utils/videoTypes';
import type { Song } from '../types/tango';

const songs = songsData as Song[];
const allRoundsRaw = (roundsData as any).rounds as Array<any>;
const songMap = new Map(songs.map(s => [s.song_id, s]));

// 곡별 결승 배치 포지션 분포 + 우승 사용 횟수 사전 계산
interface SongStrat {
  finalCount: number;
  semiCount: number;
  championCount: number;
  posCount: Record<number, number>;
  preferredPos: number | null;
  tier: 'gold' | 'silver' | 'bronze' | 'unknown';
}

const strategyMap: Map<string, SongStrat> = (() => {
  const map = new Map<string, SongStrat>();
  for (const s of songs) {
    map.set(s.song_id, {
      finalCount: 0, semiCount: 0, championCount: 0, posCount: {}, preferredPos: null, tier: 'unknown',
    });
  }
  for (const r of allRoundsRaw) {
    const isChamp = r.rankings?.some((rk: any) => rk.rank === 1);
    for (const s of r.songs || []) {
      const entry = map.get(s.song_id);
      if (!entry) continue;
      if (r.stage === 'final') {
        entry.finalCount++;
        if (s.order) entry.posCount[s.order] = (entry.posCount[s.order] ?? 0) + 1;
        if (isChamp) entry.championCount++;
      }
      if (r.stage === 'semifinal') entry.semiCount++;
    }
  }
  for (const entry of map.values()) {
    const top = Object.entries(entry.posCount).sort((a, b) => b[1] - a[1])[0];
    entry.preferredPos = top ? Number(top[0]) : null;
    if (entry.championCount > 0 && entry.finalCount >= 2) entry.tier = 'gold';
    else if (entry.finalCount >= 2) entry.tier = 'silver';
    else if (entry.finalCount >= 1 || entry.semiCount >= 2) entry.tier = 'bronze';
    else entry.tier = 'unknown';
  }
  return map;
})();

// 🏆 역대 우승 탄다 DB (Mundial 결승 + rank 1 커플)
interface ChampionTanda {
  round_id: string;
  year: number;
  competition: string;
  category: string;
  champion: string; // "leader & follower"
  promedio: number;
  songs: Array<{ song_id: string; title: string; orchestra: string; order: number }>;
  videoId: string | null;
  orchestraId: string | null; // 대표 악단 (과반)
  primaryGenre: string | null;
  yearMin: number;
  yearMax: number;
}

const championTandas: ChampionTanda[] = (() => {
  const result: ChampionTanda[] = [];
  for (const r of allRoundsRaw) {
    if (r.stage !== 'final') continue;
    const winner = r.rankings?.find((rk: any) => rk.rank === 1);
    if (!winner) continue;
    if (!r.songs || r.songs.length === 0) continue;

    // 대표 악단: 과반
    const orchCount: Record<string, number> = {};
    const genreCount: Record<string, number> = {};
    const years: number[] = [];
    for (const s of r.songs) {
      const meta = songMap.get(s.song_id);
      const oid = meta?.orchestra_id;
      if (oid) orchCount[oid] = (orchCount[oid] ?? 0) + 1;
      if (meta?.genre) genreCount[meta.genre] = (genreCount[meta.genre] ?? 0) + 1;
      if (meta?.recording_date) {
        const y = parseInt(meta.recording_date);
        if (!isNaN(y)) years.push(y);
      }
    }
    const topOrch = Object.entries(orchCount).sort((a, b) => b[1] - a[1])[0];
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0];

    const perfVid = (r.videos || []).find((v: any) => isPerformanceVideo(v));
    result.push({
      round_id: r.round_id,
      year: r.year,
      competition: r.competition,
      category: r.category,
      champion: `${winner.leader} & ${winner.follower}`,
      promedio: winner.promedio,
      songs: r.songs,
      videoId: perfVid?.video_id ?? null,
      orchestraId: topOrch ? topOrch[0] : null,
      primaryGenre: topGenre ? topGenre[0] : null,
      yearMin: years.length > 0 ? Math.min(...years) : 0,
      yearMax: years.length > 0 ? Math.max(...years) : 0,
    });
  }
  return result;
})();

const STORAGE_KEY = 'tango_simulator_draft';
const CAT_KEY = 'tango_simulator_category';

type Slot = { song_id: string | null };
type TandaCategory = 'pista' | 'milonga' | 'vals';

// 부문 메타
const CATEGORY_META: Record<TandaCategory, {
  label: string;
  labelKo: string;
  description: string;
  slots: number;
  positionRoles: string[];
  genres: string[]; // 매칭 가능한 song.genre 값
  keywords: RegExp; // 탠다 제목에서 카테고리 판별용
  emoji: string;
}> = {
  pista: {
    label: 'Tango de Pista',
    labelKo: '피스타 (살롱)',
    description: '전통 살롱 탱고 탄다 · 4/4박자 · Di Sarli/Caló/Pugliese/Troilo 중심',
    slots: 4,
    positionRoles: ['오프너', '빌드업', '클라이맥스', '클로저'],
    genres: ['tango'],
    keywords: /^(?!.*(milonga|vals|waltz)).*/i,
    emoji: '🎭',
  },
  milonga: {
    label: 'Milonga',
    labelKo: '밀롱가',
    description: '빠른 2/4박자 · D\'Arienzo/Canaro/Rodríguez 중심 · 리듬 스텝',
    slots: 3,
    positionRoles: ['오프너', '빌드업', '클라이맥스'],
    genres: ['milonga'],
    keywords: /milonga/i,
    emoji: '💃',
  },
  vals: {
    label: 'Vals',
    labelKo: '발스 (왈츠)',
    description: '3/4박자 · Pugliese/Caló/Canaro/D\'Agostino 중심 · 회전·흐름',
    slots: 3,
    positionRoles: ['오프너', '빌드업', '클라이맥스'],
    genres: ['vals'],
    keywords: /vals|waltz/i,
    emoji: '🎵',
  },
};

export function TandaSimulatorPage() {
  const [category, setCategory] = useState<TandaCategory>(() => {
    try {
      const saved = localStorage.getItem(CAT_KEY);
      if (saved === 'pista' || saved === 'milonga' || saved === 'vals') return saved;
    } catch { /* ignore */ }
    return 'pista';
  });
  const meta = CATEGORY_META[category];

  const [slots, setSlots] = useState<Slot[]>(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${category}`);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return Array(meta.slots).fill(null).map(() => ({ song_id: null }));
  });
  const [searchIdx, setSearchIdx] = useState<number | null>(null);
  const [query, setQuery] = useState('');

  // 카테고리 변경 시 해당 카테고리 저장본 불러오기
  useEffect(() => {
    localStorage.setItem(CAT_KEY, category);
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}_${category}`);
      if (raw) {
        setSlots(JSON.parse(raw));
      } else {
        setSlots(Array(CATEGORY_META[category].slots).fill(null).map(() => ({ song_id: null })));
      }
    } catch {
      setSlots(Array(CATEGORY_META[category].slots).fill(null).map(() => ({ song_id: null })));
    }
  }, [category]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_${category}`, JSON.stringify(slots));
  }, [slots, category]);

  const pickedSongs = useMemo(
    () => slots.map(s => s.song_id ? songMap.get(s.song_id) ?? null : null),
    [slots]
  );

  const filledCount = pickedSongs.filter(Boolean).length;

  // 🎯 탄다 전체 분석
  const analysis = useMemo(() => {
    const filled = pickedSongs.filter((s): s is Song => !!s);
    if (filled.length === 0) return null;

    // 1. 악단 일관성
    const orchIds = new Set(filled.map(s => s.orchestra_id).filter(Boolean));
    const orchestraCoherence = orchIds.size === 1;

    // 2. 연도 범위
    const years = filled
      .map(s => s.recording_date ? parseInt(s.recording_date) : null)
      .filter((y): y is number => y !== null);
    const yearRange = years.length > 0 ? Math.max(...years) - Math.min(...years) : 0;
    const yearTight = yearRange <= 5 && years.length === filled.length;

    // 3. 장르 일관성
    const genres = new Set(filled.map(s => s.genre));
    const genreCoherence = genres.size === 1;
    const singleGenre = genres.size === 1 ? filled[0].genre : 'mixed';

    // 4. 티어 점수 합산
    const tierPoints: Record<string, number> = { gold: 3, silver: 2, bronze: 1, unknown: 0 };
    const tiers = filled.map(s => strategyMap.get(s.song_id)?.tier ?? 'unknown');
    const tierScore = tiers.reduce((sum, t) => sum + tierPoints[t], 0);
    const maxTierScore = filled.length * 3;
    const tierPct = maxTierScore > 0 ? tierScore / maxTierScore : 0;

    // 5. 포지션 적합도 — 슬롯 i+1번째에 놓인 곡이 실제로 그 포지션을 선호하는가
    let posMatches = 0;
    let posChecked = 0;
    const posHints: Array<{ idx: number; preferred: number | null; actual: number }> = [];
    pickedSongs.forEach((s, i) => {
      if (!s) return;
      const strat = strategyMap.get(s.song_id);
      const actualPos = i + 1;
      const preferred = strat?.preferredPos ?? null;
      posHints.push({ idx: i, preferred, actual: actualPos });
      if (preferred !== null) {
        posChecked++;
        if (preferred === actualPos) posMatches++;
      }
    });
    const posPct = posChecked > 0 ? posMatches / posChecked : 0;

    // 6. 우승 탄다 사용 총합
    const totalChampionUses = filled.reduce((sum, s) => sum + (strategyMap.get(s.song_id)?.championCount ?? 0), 0);
    const totalFinalUses = filled.reduce((sum, s) => sum + (strategyMap.get(s.song_id)?.finalCount ?? 0), 0);

    // 7. 종합 점수 (0~100)
    let score = 0;
    score += tierPct * 40; // 티어 40점
    score += posPct * 20; // 포지션 20점
    score += orchestraCoherence ? 15 : 0; // 악단 일관성 15점
    score += genreCoherence ? 10 : 0; // 장르 일관성 10점
    score += yearTight ? 10 : 0; // 연도 범위 10점
    if (totalChampionUses > 0) score += Math.min(5, totalChampionUses); // 우승 보너스 최대 5점
    score = Math.round(Math.min(100, score));

    // 8. 판정 + 제안
    let verdict = '';
    let grade = '';
    if (score >= 85) { grade = '★★★ 결승 레벨'; verdict = 'Mundial 결승 탄다와 직접 경쟁 가능한 구성.'; }
    else if (score >= 70) { grade = '★★ 준결승 돌파'; verdict = '결승까지 한 곡 업그레이드만 남음.'; }
    else if (score >= 55) { grade = '★ 예선 통과'; verdict = '기본 뼈대 갖춤. 한두 곡 gold 티어로 교체 권장.'; }
    else if (score >= 35) { grade = '△ 보강 필요'; verdict = '차별화는 되지만 실전성 부족. 결승 단골곡 추가 필요.'; }
    else { grade = '○ 초안'; verdict = '아직 전략 색채가 약함. 톱 티어 곡을 중심으로 재구성.'; }

    const suggestions: string[] = [];
    if (!orchestraCoherence && filled.length >= 3) {
      suggestions.push('전통 탄다는 한 악단으로 통일하면 심사 안정감 ↑');
    }
    if (!yearTight && years.length === filled.length) {
      suggestions.push(`녹음 연도 범위 ${yearRange}년 — 5년 이내로 좁히면 톤 일관성 ↑`);
    }
    if (posPct < 0.5 && posChecked >= 2) {
      suggestions.push('배치 순서가 곡의 역사적 포지션과 어긋남. 순서 재검토');
    }
    if (tierPct < 0.5) {
      suggestions.push('결승 이력 약한 곡이 많음. gold/silver 티어 대체곡 고려');
    }
    if (totalChampionUses === 0 && filled.length >= 3) {
      suggestions.push('우승 탄다 사용 이력 0. 최소 1곡은 우승 빈출곡으로');
    }

    return {
      score, grade, verdict, suggestions,
      orchestraCoherence, genreCoherence, singleGenre, yearRange, yearTight,
      tierPct, posPct, posMatches, posChecked,
      totalChampionUses, totalFinalUses,
      tiers, posHints, orchCount: orchIds.size, years,
    };
  }, [pickedSongs]);

  // 🏆 닮은 우승 탄다 TOP 3 (현재 카테고리에 맞는 탄다만)
  const similarChampions = useMemo(() => {
    const filled = pickedSongs.filter((s): s is Song => !!s);
    if (filled.length < 2) return [];

    const mySongIds = new Set(filled.map(s => s.song_id));
    const myOrchIds = new Set(filled.map(s => s.orchestra_id).filter(Boolean));
    const myGenres = new Set(filled.map(s => s.genre));
    const myYears = filled.map(s => s.recording_date ? parseInt(s.recording_date) : null).filter((y): y is number => y !== null);
    const myYearAvg = myYears.length > 0 ? myYears.reduce((a, b) => a + b, 0) / myYears.length : 0;

    // 현재 카테고리에 맞는 챔피언 탄다만 필터
    const filteredChampions = championTandas.filter(ct => {
      const ctCat = (ct.category || '').toLowerCase();
      if (category === 'milonga') return /milonga/.test(ctCat);
      if (category === 'vals') return /vals/.test(ctCat);
      // pista: 밀롱가/발스 제외 + tango_de_pista, pista, pista_senior 허용
      return !/milonga|vals|escenario|fantasia|freestyle|formation/.test(ctCat);
    });

    const scored = filteredChampions.map(ct => {
      // 1) 곡 겹침 (40점) — jaccard 유사도
      const ctSongIds = new Set(ct.songs.map(s => s.song_id));
      const intersect = [...mySongIds].filter(id => ctSongIds.has(id)).length;
      const union = new Set([...mySongIds, ...ctSongIds]).size;
      const songOverlap = union > 0 ? intersect / union : 0;
      const songScore = songOverlap * 40;

      // 2) 악단 일치 (30점) — 대표 악단이 내 악단들과 일치
      const orchScore = ct.orchestraId && myOrchIds.has(ct.orchestraId) ? 30 : 0;

      // 3) 장르 일치 (20점)
      const genreScore = ct.primaryGenre && myGenres.has(ct.primaryGenre) ? 20 : 0;

      // 4) 연도 근접 (10점) — 5년 이내 중앙값
      let yearScore = 0;
      if (myYearAvg > 0 && ct.yearMin > 0) {
        const ctYearAvg = (ct.yearMin + ct.yearMax) / 2;
        const diff = Math.abs(myYearAvg - ctYearAvg);
        if (diff <= 3) yearScore = 10;
        else if (diff <= 7) yearScore = 6;
        else if (diff <= 15) yearScore = 2;
      }

      const total = songScore + orchScore + genreScore + yearScore;

      // 차이점 생성
      const diffs: string[] = [];
      if (intersect > 0) diffs.push(`곡 ${intersect}개 공유`);
      if (orchScore > 0) diffs.push('악단 일치');
      else if (ct.orchestraId) {
        const orchName = songs.find(s => s.orchestra_id === ct.orchestraId)?.orchestra?.split(' ').slice(0, 2).join(' ') || '';
        if (orchName) diffs.push(`악단 차이: ${orchName}`);
      }
      if (genreScore === 0 && ct.primaryGenre) diffs.push(`장르 ${ct.primaryGenre}`);

      return { tanda: ct, score: Math.round(total), intersect, diffs };
    }).filter(x => x.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
  }, [pickedSongs, category]);

  const updateSlot = (idx: number, songId: string | null) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { song_id: songId } : s));
  };

  const moveSlot = (from: number, to: number) => {
    if (to < 0 || to >= slots.length) return;
    setSlots(prev => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const resetAll = () => {
    if (!confirm('탄다 초기화?')) return;
    setSlots([{ song_id: null }, { song_id: null }, { song_id: null }, { song_id: null }]);
  };

  // 검색 결과 — 현재 카테고리의 장르만 필터
  const searchResults = useMemo(() => {
    // 카테고리 맞는 곡만
    const categorySongs = songs.filter(s => meta.genres.includes(s.genre));

    if (!query.trim()) {
      // 초기: 상위 인기곡 (결승 사용 많은 순)
      return [...categorySongs]
        .sort((a, b) => (strategyMap.get(b.song_id)?.finalCount ?? 0) - (strategyMap.get(a.song_id)?.finalCount ?? 0))
        .slice(0, 30);
    }
    const q = query.toLowerCase();
    return categorySongs.filter(s =>
      s.title.toLowerCase().includes(q) ||
      (s.orchestra || '').toLowerCase().includes(q) ||
      (s.vocalist || '').toLowerCase().includes(q)
    ).slice(0, 40);
  }, [query, category, meta.genres]);

  return (
    <>
      <PageHeader title="탄다 시뮬레이터" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-8">

          {/* 부문 선택 탭 */}
          <div className="flex gap-2 justify-center">
            {(['pista', 'milonga', 'vals'] as const).map(c => {
              const m = CATEGORY_META[c];
              const isActive = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex-1 max-w-xs rounded-sm border p-4 text-left transition-all ${
                    isActive
                      ? 'border-tango-brass bg-tango-brass/10 shadow-lg'
                      : 'border-tango-brass/20 bg-white/5 hover:border-tango-brass/50'
                  }`}
                >
                  <div className={`text-2xl mb-1 ${isActive ? '' : 'opacity-60'}`}>{m.emoji}</div>
                  <div className={`text-[10px] tracking-[0.3em] uppercase font-sans mb-1 ${isActive ? 'text-tango-brass' : 'text-tango-cream/50'}`}>
                    {m.label}
                  </div>
                  <div className={`font-display italic text-lg ${isActive ? 'text-tango-paper' : 'text-tango-cream/70'}`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {m.labelKo}
                  </div>
                  <div className={`text-[10px] font-serif italic mt-1 ${isActive ? 'text-tango-cream/80' : 'text-tango-cream/40'}`} style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {m.slots}곡 탄다
                  </div>
                </button>
              );
            })}
          </div>

          {/* 부문 설명 */}
          <div className="bg-gradient-to-br from-tango-brass/5 to-transparent border border-tango-brass/15 rounded-sm p-4 text-sm text-tango-cream/80 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            <span className="text-tango-brass font-semibold">{meta.emoji} {meta.label}</span> · {meta.description}
          </div>

          {/* HERO */}
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Tanda Simulator · {meta.label} 결승 적합도
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              내 <em className="text-tango-brass">{meta.labelKo}</em> 탄다 실험실
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              곡 4개를 고르면 Mundial 결승 데이터로 적합도를 계산합니다
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 점수 대시보드 */}
          {analysis && (
            <div className={`rounded-sm border p-6 md:p-8 ${
              analysis.score >= 85 ? 'bg-gradient-to-br from-tango-brass/20 via-tango-shadow to-tango-ink border-tango-brass/50' :
              analysis.score >= 70 ? 'bg-gradient-to-br from-tango-brass/12 via-tango-shadow to-tango-ink border-tango-brass/35' :
              analysis.score >= 55 ? 'bg-gradient-to-br from-tango-brass/8 via-tango-shadow to-tango-ink border-tango-brass/25' :
              'bg-white/5 border-tango-brass/15'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
                    Overall Score
                  </div>
                  <div className="font-display italic text-2xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {analysis.grade}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-5xl md:text-6xl font-bold text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {analysis.score}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-tango-cream/50 font-sans">/ 100</div>
                </div>
              </div>

              <p className="font-serif italic text-base text-tango-paper/90 mb-5" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {analysis.verdict}
              </p>

              {/* 세부 지표 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <MetricBar label="티어 점수" value={analysis.tierPct} max={40} />
                <MetricBar label="포지션 적합" value={analysis.posPct} max={20} />
                <MetricBox label="악단 일관" active={analysis.orchestraCoherence} max={15} text={analysis.orchestraCoherence ? '통일' : `${analysis.orchCount}개`} />
                <MetricBox label="장르 일관" active={analysis.genreCoherence} max={10} text={analysis.singleGenre === 'mixed' ? '혼합' : analysis.singleGenre} />
                <MetricBox label="연도 범위" active={analysis.yearTight} max={10} text={analysis.years.length > 0 ? `±${analysis.yearRange}년` : '—'} />
              </div>

              {/* 제안 */}
              {analysis.suggestions.length > 0 && (
                <div className="mt-5 pt-5 border-t border-tango-brass/15">
                  <div className="text-[10px] tracking-widest uppercase text-tango-brass font-sans mb-2">
                    개선 제안
                  </div>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-tango-paper/85 font-serif italic flex gap-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        <span className="text-tango-brass flex-shrink-0">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 실전 기록 */}
              <div className="mt-4 pt-4 border-t border-tango-brass/15 flex items-center gap-6 text-xs text-tango-cream/70 font-sans">
                <span>결승 사용 총 <span className="text-tango-brass font-semibold">{analysis.totalFinalUses}</span>회</span>
                {analysis.totalChampionUses > 0 && (
                  <span>🏆 우승 탄다 사용 <span className="text-tango-brass font-semibold">{analysis.totalChampionUses}</span>회</span>
                )}
              </div>
            </div>
          )}

          {/* 탄다 슬롯 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                Your Tanda · {filledCount}/4
              </div>
              {filledCount > 0 && (
                <button onClick={resetAll} className="text-xs text-tango-cream/50 hover:text-red-400">초기화</button>
              )}
            </div>
            <div className="space-y-2">
              {slots.map((_slot, i) => {
                const song = pickedSongs[i];
                const strat = song ? strategyMap.get(song.song_id) : null;
                const preferredPos = strat?.preferredPos;
                const actualPos = i + 1;
                const posOk = preferredPos !== null && preferredPos !== undefined && preferredPos === actualPos;
                const posWarn = preferredPos !== null && preferredPos !== undefined && preferredPos !== actualPos;

                return (
                  <div
                    key={i}
                    className={`rounded-sm border p-4 flex items-center gap-4 ${
                      song
                        ? strat?.tier === 'gold' ? 'border-tango-brass/50 bg-tango-brass/10'
                        : strat?.tier === 'silver' ? 'border-tango-brass/30 bg-tango-brass/5'
                        : 'border-tango-brass/15 bg-white/5'
                        : 'border-dashed border-tango-brass/25 bg-white/2'
                    }`}
                  >
                    {/* 포지션 번호 */}
                    <div className="flex-shrink-0 w-12 text-center">
                      <div className="font-display text-3xl text-tango-brass/60 italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {i + 1}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-tango-cream/40">
                        {i === 0 ? '오프너' : i === 1 ? '빌드업' : i === 2 ? '클라이맥스' : '클로저'}
                      </div>
                    </div>

                    {/* 곡 정보 or 빈 슬롯 */}
                    <div className="flex-1 min-w-0">
                      {song ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg ${
                              strat?.tier === 'gold' ? 'text-tango-brass' :
                              strat?.tier === 'silver' ? 'text-tango-brass/60' :
                              strat?.tier === 'bronze' ? 'text-tango-brass/40' : 'text-gray-600'
                            }`}>
                              {strat?.tier === 'gold' ? '★' : strat?.tier === 'silver' ? '◆' : strat?.tier === 'bronze' ? '◇' : '○'}
                            </span>
                            <Link to={`/song/${song.song_id}`} className="font-serif italic text-lg text-tango-paper hover:text-tango-brass truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              {song.title}
                            </Link>
                          </div>
                          <div className="text-[11px] text-tango-cream/60 font-sans truncate">
                            {song.orchestra}
                            {song.vocalist && ` · ${song.vocalist}`}
                            {song.recording_date && ` · ${song.recording_date}`}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                            <span className="text-tango-cream/50">
                              결승 {strat?.finalCount ?? 0}회
                            </span>
                            {(strat?.championCount ?? 0) > 0 && (
                              <span className="text-tango-brass">🏆 {strat?.championCount}</span>
                            )}
                            {preferredPos && (
                              <span className={posOk ? 'text-green-400' : posWarn ? 'text-orange-400' : 'text-tango-cream/50'}>
                                {posOk ? '✓ 선호 포지션' : `선호: ${preferredPos}번`}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => { setSearchIdx(i); setQuery(''); }}
                          className="w-full text-left text-sm text-tango-cream/50 hover:text-tango-brass font-serif italic"
                          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                        >
                          + 곡 선택
                        </button>
                      )}
                    </div>

                    {/* 컨트롤 */}
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {song ? (
                        <>
                          <button onClick={() => moveSlot(i, i - 1)} disabled={i === 0}
                            className="w-8 h-8 rounded-sm text-tango-cream/60 hover:text-tango-brass hover:bg-tango-brass/10 disabled:opacity-20 text-sm">↑</button>
                          <button onClick={() => moveSlot(i, i + 1)} disabled={i === slots.length - 1}
                            className="w-8 h-8 rounded-sm text-tango-cream/60 hover:text-tango-brass hover:bg-tango-brass/10 disabled:opacity-20 text-sm">↓</button>
                          <button onClick={() => updateSlot(i, null)}
                            className="w-8 h-8 rounded-sm text-tango-cream/60 hover:text-red-400 text-sm">×</button>
                          <button onClick={() => { setSearchIdx(i); setQuery(''); }}
                            className="px-3 h-8 rounded-sm text-[11px] text-tango-brass hover:bg-tango-brass/10">변경</button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setSearchIdx(i); setQuery(''); }}
                          className="px-3 h-8 rounded-sm border border-tango-brass/40 text-[11px] text-tango-brass hover:bg-tango-brass/10"
                        >
                          선택
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="mt-3 text-[10px] text-tango-cream/50 font-sans">
              ★ 우승 탄다 포함 (gold) · ◆ 결승 2회+ (silver) · ◇ 결승 1회 (bronze) · ○ 결승 이력 없음
            </div>
          </div>

          {/* 🏆 닮은 우승 탄다 TOP 3 */}
          {similarChampions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                  Champion Benchmark · 닮은 우승 탄다
                </div>
                <Link to="/champions" className="text-[10px] text-tango-brass hover:underline">전체 →</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {similarChampions.map(({ tanda, score, intersect, diffs }) => {
                  const stageLabel = tanda.category === 'vals' ? '발스' : tanda.category === 'milonga' ? '밀롱가' : '피스타';
                  const myIds = new Set(pickedSongs.filter(Boolean).map(s => s!.song_id));
                  return (
                    <div key={tanda.round_id} className="rounded-sm border border-tango-brass/25 bg-white/5 overflow-hidden flex flex-col">
                      {/* 영상 썸네일 */}
                      {tanda.videoId ? (
                        <a
                          href={`https://www.youtube.com/watch?v=${tanda.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block aspect-video bg-black group"
                        >
                          <img
                            src={`https://img.youtube.com/vi/${tanda.videoId}/mqdefault.jpg`}
                            alt={`${tanda.champion} Mundial ${tanda.year}`}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-tango-brass/80 flex items-center justify-center">
                              <span className="text-tango-ink text-sm ml-0.5">▶</span>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 bg-tango-brass text-tango-ink px-2 py-0.5 rounded-sm text-[10px] font-bold">
                            {score}점 유사
                          </div>
                        </a>
                      ) : (
                        <div className="aspect-video bg-tango-shadow flex items-center justify-center relative">
                          <span className="text-tango-cream/30 text-xs">영상 없음</span>
                          <div className="absolute top-2 right-2 bg-tango-brass text-tango-ink px-2 py-0.5 rounded-sm text-[10px] font-bold">
                            {score}점 유사
                          </div>
                        </div>
                      )}

                      {/* 본문 */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="text-[10px] tracking-widest uppercase text-tango-brass font-sans mb-1">
                          🏆 {tanda.competition} {tanda.year} · {stageLabel}
                        </div>
                        <div className="font-serif italic text-base text-tango-paper mb-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {tanda.champion}
                        </div>
                        <div className="text-[10px] text-tango-cream/50 font-sans mb-3">
                          평균 {tanda.promedio.toFixed(3)}
                        </div>

                        {/* 곡 리스트 */}
                        <div className="space-y-1 mb-3 flex-1">
                          {tanda.songs.map((s, i) => {
                            const shared = myIds.has(s.song_id);
                            return (
                              <div key={i} className={`flex items-baseline gap-2 text-xs ${shared ? 'text-tango-brass' : 'text-tango-cream/70'}`}>
                                <span className="w-4 font-mono text-[10px]">{i + 1}</span>
                                {shared && <span className="text-[10px]">✓</span>}
                                <Link to={`/song/${s.song_id}`} className="truncate hover:underline font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                                  {s.title}
                                </Link>
                              </div>
                            );
                          })}
                        </div>

                        {/* 차이점 */}
                        {diffs.length > 0 && (
                          <div className="pt-3 border-t border-tango-brass/15 flex flex-wrap gap-1">
                            {diffs.map((d, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-tango-brass/10 text-tango-brass/80 rounded-sm">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}

                        {intersect > 0 && (
                          <div className="mt-2 text-[10px] text-green-400 font-sans">
                            ✓ 내 탄다와 {intersect}곡 일치
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-[10px] text-tango-cream/40 font-sans">
                유사도 = 곡 겹침(40) + 악단 일치(30) + 장르 일치(20) + 연도 근접(10)
              </div>
            </div>
          )}

          {/* 곡 선택 모달 */}
          {searchIdx !== null && (
            <div
              className="fixed inset-0 z-50 bg-tango-ink/90 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
              onClick={() => setSearchIdx(null)}
            >
              <div
                className="w-full max-w-2xl bg-tango-shadow border border-tango-brass/30 rounded-sm p-5 mt-10"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] tracking-widest uppercase text-tango-brass font-sans">
                      {searchIdx + 1}번 포지션 — {searchIdx === 0 ? '오프너' : searchIdx === 1 ? '빌드업' : searchIdx === 2 ? '클라이맥스' : '클로저'}
                    </div>
                    <h3 className="font-display italic text-xl text-tango-paper mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      곡 선택
                    </h3>
                  </div>
                  <button onClick={() => setSearchIdx(null)} className="text-tango-cream/60 hover:text-red-400 text-xl">×</button>
                </div>

                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="곡명 / 악단 / 보컬 검색… (빈칸: 결승 빈출곡 TOP 30)"
                  className="w-full bg-transparent border-b-2 border-tango-brass/30 focus:border-tango-brass pb-2 pt-1 font-serif text-lg text-tango-paper placeholder-tango-cream/30 focus:outline-none"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                />

                <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-1">
                  {searchResults.map(s => {
                    const strat = strategyMap.get(s.song_id);
                    const posRec = strat?.preferredPos;
                    const posMatch = posRec === searchIdx + 1;
                    return (
                      <button
                        key={s.song_id}
                        onClick={() => { updateSlot(searchIdx, s.song_id); setSearchIdx(null); }}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-colors ${
                          posMatch ? 'border-green-500/40 bg-green-500/5 hover:bg-green-500/10' : 'border-transparent hover:bg-tango-brass/5'
                        }`}
                      >
                        <span className={`text-lg ${
                          strat?.tier === 'gold' ? 'text-tango-brass' :
                          strat?.tier === 'silver' ? 'text-tango-brass/60' :
                          strat?.tier === 'bronze' ? 'text-tango-brass/40' : 'text-gray-700'
                        }`}>
                          {strat?.tier === 'gold' ? '★' : strat?.tier === 'silver' ? '◆' : strat?.tier === 'bronze' ? '◇' : '○'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-serif italic text-base text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {s.title}
                          </div>
                          <div className="text-[10px] text-tango-cream/50 truncate font-sans">
                            {s.orchestra}{s.vocalist ? ` · ${s.vocalist}` : ''}{s.recording_date ? ` · ${s.recording_date}` : ''}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          {(strat?.championCount ?? 0) > 0 && (
                            <div className="text-[10px] text-tango-brass">🏆 {strat?.championCount}</div>
                          )}
                          <div className="text-[10px] text-tango-cream/50">결승 {strat?.finalCount ?? 0}회</div>
                          {posMatch && (
                            <div className="text-[10px] text-green-400">✓ 포지션</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {searchResults.length === 0 && (
                    <div className="text-center py-8 text-sm text-tango-cream/50">검색 결과 없음</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}

function MetricBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="bg-white/5 border border-tango-brass/15 rounded-sm p-3">
      <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-1">{label}</div>
      <div className="font-display text-xl text-tango-brass mb-1.5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {pct}%
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-tango-brass" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[9px] text-tango-cream/40 mt-1">최대 {max}점</div>
    </div>
  );
}

function MetricBox({ label, active, max, text }: { label: string; active: boolean; max: number; text: string }) {
  return (
    <div className={`rounded-sm border p-3 ${active ? 'border-tango-brass/40 bg-tango-brass/5' : 'border-tango-brass/15 bg-white/5'}`}>
      <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mb-1">{label}</div>
      <div className={`font-display text-base ${active ? 'text-tango-brass' : 'text-tango-paper/70'}`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {active ? '✓ ' : ''}{text}
      </div>
      <div className="text-[9px] text-tango-cream/40 mt-1">{active ? `+${max}점` : `최대 ${max}점`}</div>
    </div>
  );
}
