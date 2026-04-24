// 영상 콜라주 — 여러 영상 동시 재생 비교
// 우리 영상 vs 챔피언 영상, 연도별 성장 비교 등
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { isPerformanceVideo } from '../utils/videoTypes';
import roundsData from '../data/competition_rounds.json';

const MY_VIDEOS = [
  { id: 'GbiiDONSSWI', label: '🏆 2023 Milonga 결승 6위', year: 2023, category: 'milonga' },
  { id: 'zyMNqg4N0XU', label: '2023 Milonga 준결승 A조 · 9위', year: 2023, category: 'milonga' },
  { id: 'w4j12NGjOD4', label: '2023 Milonga 예선 E조', year: 2023, category: 'milonga' },
  { id: 'Hl1FSNIlY1w', label: '2023 Jack 준결승 B조 · 22위 (석정)', year: 2023, category: 'jack' },
  { id: 'rbdGrbJwHi0', label: '2024 Pista 준결승 R2 · 30위', year: 2024, category: 'pista' },
  { id: 'KsI2EgUno5s', label: '2024 Jack 준결승 R2 · 20위 (석정)', year: 2024, category: 'jack' },
];

// 프리셋 비교 시나리오
const PRESETS: Array<{ id: string; name: string; desc: string; videos: string[] }> = [
  {
    id: 'milonga-vs-pista',
    name: '🎯 내 강점 vs 약점',
    desc: '밀롱가 결승 6위 vs 피스타 준결승 30위 — 무엇이 다른지',
    videos: ['GbiiDONSSWI', 'rbdGrbJwHi0'],
  },
  {
    id: 'milonga-journey',
    name: '💃 밀롱가 성장 궤적',
    desc: '예선 → 준결승 → 결승 (같은 대회에서의 진화)',
    videos: ['w4j12NGjOD4', 'zyMNqg4N0XU', 'GbiiDONSSWI'],
  },
  {
    id: 'jack-23-vs-24',
    name: '🕺 석정 1년 성장',
    desc: '2023 Jack 22위 (7.7) → 2024 Jack 20위 (8.18) — 0.48점 상승',
    videos: ['Hl1FSNIlY1w', 'KsI2EgUno5s'],
  },
];

export function VideoCollagePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['GbiiDONSSWI', 'rbdGrbJwHi0']);
  const [searchMode, setSearchMode] = useState(false);

  // 전체 영상 (우리 + Mundial 챔피언 결승 주요)
  const allAvailable = useMemo(() => {
    const rounds = (roundsData as any).rounds;
    const list: Array<{ id: string; label: string; category: 'my' | 'champion' | 'other' }> = [];
    // 우리
    for (const v of MY_VIDEOS) list.push({ id: v.id, label: v.label, category: 'my' });
    // 챔피언 영상 (performance only)
    for (const r of rounds) {
      if (r.competition !== 'Mundial' || r.stage !== 'final') continue;
      for (const v of (r.videos || [])) {
        if (!isPerformanceVideo(v)) continue;
        list.push({
          id: v.video_id,
          label: `${r.year} Mundial ${r.stage === 'final' ? '결승' : r.stage} R${r.ronda_number}`,
          category: 'champion',
        });
      }
    }
    // 중복 제거
    const seen = new Set<string>();
    return list.filter(v => !seen.has(v.id) && seen.add(v.id));
  }, []);

  const selectedVideos = useMemo(
    () => selectedIds.map(id => allAvailable.find(v => v.id === id)).filter(Boolean) as typeof allAvailable,
    [selectedIds, allAvailable]
  );

  const togglePin = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const loadPreset = (preset: typeof PRESETS[number]) => {
    setSelectedIds(preset.videos);
  };

  const gridCols = selectedVideos.length === 1 ? 'grid-cols-1' :
                   selectedVideos.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                   selectedVideos.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                   'grid-cols-1 md:grid-cols-2';

  return (
    <>
      <PageHeader title="영상 콜라주" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-7xl mx-auto px-3 md:px-8 py-6 space-y-6">

          {/* HERO */}
          <section className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              Video Collage · 동시 비교
            </div>
            <h1 className="font-display text-2xl md:text-4xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              여러 영상을 <em className="text-tango-brass">나란히</em>
            </h1>
            <p className="text-xs md:text-sm text-tango-cream/60 mt-2 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              최대 4개 영상 동시 재생 · 강점/약점 시각적 비교 · 챔피언 벤치마크
            </p>
            <OrnamentDivider className="mt-4" />
          </section>

          {/* 프리셋 시나리오 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Suggested Comparisons
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  className="text-left bg-tango-shadow/40 hover:bg-tango-brass/10 border border-tango-brass/20 hover:border-tango-brass/50 rounded-sm p-3 transition-all"
                >
                  <div className="font-display italic text-base text-tango-paper mb-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {p.name}
                  </div>
                  <div className="text-[11px] text-tango-cream/60 font-serif italic leading-snug" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {p.desc}
                  </div>
                  <div className="text-[10px] text-tango-brass mt-1.5">{p.videos.length}개 영상</div>
                </button>
              ))}
            </div>
          </section>

          {/* 선택된 영상 툴바 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                Selected · {selectedVideos.length}/4
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds([])}
                  disabled={selectedVideos.length === 0}
                  className="text-[10px] text-tango-cream/60 hover:text-red-400 disabled:opacity-30"
                >
                  모두 제거
                </button>
                <button
                  onClick={() => setSearchMode(!searchMode)}
                  className="text-[10px] bg-tango-brass/20 text-tango-brass rounded-sm px-2 py-1 hover:bg-tango-brass/30"
                >
                  {searchMode ? '✕ 닫기' : '+ 영상 추가'}
                </button>
              </div>
            </div>

            {/* 선택된 영상 칩 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedVideos.map(v => (
                <button
                  key={v.id}
                  onClick={() => togglePin(v.id)}
                  className="inline-flex items-center gap-1 text-[11px] bg-tango-brass/15 border border-tango-brass/40 text-tango-paper rounded-sm px-2 py-1"
                >
                  {v.label}
                  <span className="ml-1 text-red-400">✕</span>
                </button>
              ))}
              {selectedVideos.length === 0 && (
                <span className="text-[11px] text-tango-cream/50 italic">프리셋을 선택하거나 + 영상 추가로 시작하세요</span>
              )}
            </div>

            {/* 영상 선택 모달 */}
            {searchMode && (
              <div className="bg-tango-shadow/60 border border-tango-brass/20 rounded-sm p-3 max-h-64 overflow-y-auto space-y-1">
                {/* 내 영상 */}
                <div className="text-[10px] uppercase tracking-widest text-tango-brass font-sans mb-1">🌟 우리 영상</div>
                {allAvailable.filter(v => v.category === 'my').map(v => {
                  const isSelected = selectedIds.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      onClick={() => togglePin(v.id)}
                      disabled={!isSelected && selectedIds.length >= 4}
                      className={`w-full text-left px-2 py-1.5 rounded-sm text-[11px] transition-colors ${
                        isSelected ? 'bg-tango-brass/30 text-tango-brass' :
                        selectedIds.length >= 4 ? 'text-tango-cream/30 cursor-not-allowed' :
                        'text-tango-cream/80 hover:bg-white/5'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{v.label}
                    </button>
                  );
                })}
                <div className="text-[10px] uppercase tracking-widest text-tango-brass font-sans mb-1 mt-3">🏆 Mundial 결승</div>
                {allAvailable.filter(v => v.category === 'champion').slice(0, 20).map(v => {
                  const isSelected = selectedIds.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      onClick={() => togglePin(v.id)}
                      disabled={!isSelected && selectedIds.length >= 4}
                      className={`w-full text-left px-2 py-1.5 rounded-sm text-[11px] transition-colors ${
                        isSelected ? 'bg-tango-brass/30 text-tango-brass' :
                        selectedIds.length >= 4 ? 'text-tango-cream/30 cursor-not-allowed' :
                        'text-tango-cream/80 hover:bg-white/5'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{v.label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* 콜라주 그리드 */}
          {selectedVideos.length > 0 && (
            <section className={`grid ${gridCols} gap-3`}>
              {selectedVideos.map(v => (
                <div key={v.id} className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm overflow-hidden">
                  <div className="px-2 py-1.5 border-b border-tango-brass/20 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-tango-paper font-serif italic truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {v.label}
                    </span>
                    <button
                      onClick={() => togglePin(v.id)}
                      className="text-tango-cream/50 hover:text-red-400 text-xs flex-shrink-0"
                      aria-label="제거"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${v.id}?rel=0&modestbranding=1`}
                      title={v.label}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </section>
          )}

          {selectedVideos.length === 0 && (
            <div className="bg-tango-shadow/40 border border-dashed border-tango-brass/30 rounded-sm p-10 text-center">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-tango-cream/60 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                위 프리셋을 선택하거나 영상 추가 버튼으로 비교 시작
              </p>
            </div>
          )}

          {/* 네비 링크 */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-tango-brass/15">
            <Link to="/command" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
              ♔ Command Center
            </Link>
            <Link to="/champions" className="text-xs px-3 py-2 rounded-sm border border-tango-brass/40 text-tango-brass hover:bg-tango-brass/10">
              ★ 역대 우승자
            </Link>
          </div>

          <OrnamentDivider className="pt-6" />
        </div>
      </div>
    </>
  );
}
