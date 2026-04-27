// 우승 전략 페이지 — 음악 분류 4 × 차원 5 매트릭스 + 우리/우승자 분석
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import {
  useStrategyMatrix,
  MUSIC_TYPES,
  DIMENSIONS,
  cellKey,
  extractVideoEmbed,
  type MusicType,
  type Dimension,
  type VideoRef,
} from '../hooks/useStrategyMatrix';
import { useTrainingStore } from '../hooks/useTrainingStore';
import ktcData from '../data/ktc_participants.json';
import champData from '../data/mundial_champions_history.json';

export function StrategyPage() {
  const matrix = useStrategyMatrix();
  const [activeMusic, setActiveMusic] = useState<MusicType>('rhythmic');
  const [activeDim, setActiveDim] = useState<Dimension>('walk');
  const [section, setSection] = useState<'matrix' | 'analysis' | 'notes'>('matrix');

  // 우리 부부 자동 분석
  const ourAnalysis = useOurAnalysis();
  const championAnalysis = useChampionAnalysis();

  const activeCell = matrix.data.cells[cellKey(activeMusic, activeDim)] || { notes: '', reference_videos: [], own_videos: [] };
  const activeMusicMeta = MUSIC_TYPES.find(m => m.key === activeMusic)!;
  const activeDimMeta = DIMENSIONS.find(d => d.key === activeDim)!;

  return (
    <>
      <PageHeader title="우승 전략" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">

          {/* HERO */}
          <section className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              Game Plan · 우승 전략 매트릭스
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우리만의 <em className="text-tango-brass">전략 매트릭스</em>
            </h1>
            <p className="text-xs md:text-sm text-tango-cream/60 mt-3 font-serif italic px-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              음악 4분류 × 차원 5 = 20개 세트 · 음악 듣자마자 꺼낼 수 있게 미리 준비
            </p>
            <OrnamentDivider className="mt-6" />
          </section>

          {/* 진행률 */}
          <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] tracking-widest uppercase text-tango-cream/50">매트릭스 채움</span>
              <span className="font-display text-2xl text-tango-brass" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {matrix.filledCount}<span className="text-sm text-tango-cream/40">/{matrix.totalCells}</span>
              </span>
            </div>
            <div className="h-1 bg-tango-brass/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tango-brass to-tango-rose transition-all duration-500"
                style={{ width: `${matrix.progress * 100}%` }}
              />
            </div>
          </div>

          {/* 섹션 탭 */}
          <div className="flex gap-0 border-b border-tango-brass/20 overflow-x-auto">
            {[
              { k: 'matrix', l: '🎯 4×5 매트릭스' },
              { k: 'analysis', l: '📊 우리 vs 우승자 분석' },
              { k: 'notes', l: '📝 대회준비반 핵심' },
            ].map(t => (
              <button
                key={t.k}
                onClick={() => setSection(t.k as any)}
                className={`px-4 py-3 text-sm font-serif italic whitespace-nowrap transition-all border-b-2 ${
                  section === t.k
                    ? 'text-tango-paper border-tango-brass'
                    : 'text-tango-cream/50 border-transparent hover:text-tango-paper/80'
                }`}
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* === 매트릭스 === */}
          {section === 'matrix' && (
            <>
              {/* 음악 분류 선택 */}
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  Music Type · 음악 분류
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {MUSIC_TYPES.map(m => {
                    const filledForMusic = DIMENSIONS.filter(d => {
                      const c = matrix.data.cells[cellKey(m.key, d.key)];
                      return c && (c.notes.trim() || (c.reference_videos?.length || 0) > 0 || (c.own_videos?.length || 0) > 0);
                    }).length;
                    return (
                      <button
                        key={m.key}
                        onClick={() => setActiveMusic(m.key)}
                        className={`text-left p-3 rounded-sm border-2 transition-all ${
                          activeMusic === m.key ? 'bg-tango-brass/10' : 'bg-tango-shadow/30 hover:bg-tango-shadow/60'
                        }`}
                        style={{
                          borderColor: activeMusic === m.key ? m.color : `${m.color}33`,
                        }}
                      >
                        <div className="font-display text-lg text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                          {m.label}
                        </div>
                        <div className="text-[10px] tracking-widest uppercase font-sans" style={{ color: m.color }}>
                          {m.sub}
                        </div>
                        <div className="text-[10px] text-tango-cream/50 mt-1">
                          {filledForMusic}/5 채움
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 차원 선택 */}
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  Dimension · 차원
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {DIMENSIONS.map(d => {
                    const c = matrix.data.cells[cellKey(activeMusic, d.key)];
                    const filled = c && (c.notes.trim() || (c.reference_videos?.length || 0) > 0 || (c.own_videos?.length || 0) > 0);
                    return (
                      <button
                        key={d.key}
                        onClick={() => setActiveDim(d.key)}
                        className={`text-center p-2 md:p-3 rounded-sm border transition-all ${
                          activeDim === d.key
                            ? 'border-tango-brass bg-tango-brass/15'
                            : `border-tango-brass/20 hover:border-tango-brass/40 ${filled ? 'bg-tango-brass/5' : 'bg-tango-shadow/20'}`
                        }`}
                      >
                        <div className="text-xl md:text-2xl mb-1">{d.icon}</div>
                        <div className="text-[10px] md:text-xs font-serif italic text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {d.label}
                        </div>
                        {filled && <div className="text-tango-brass text-xs mt-1">●</div>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 활성 셀 에디터 */}
              <div className="bg-tango-shadow/50 border-2 rounded-sm p-5 md:p-6 space-y-5" style={{ borderColor: `${activeMusicMeta.color}66` }}>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <div>
                    <div className="text-[10px] tracking-[0.3em] uppercase font-sans" style={{ color: activeMusicMeta.color }}>
                      {activeMusicMeta.sub} · {activeDimMeta.icon} {activeDimMeta.label}
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {activeMusicMeta.label}의 {activeDimMeta.label}
                    </h2>
                    <div className="text-xs text-tango-cream/60 font-serif italic mt-1">
                      {activeDimMeta.desc}
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                <div>
                  <label className="text-[10px] tracking-widest uppercase text-tango-brass font-sans">메모</label>
                  <textarea
                    value={activeCell.notes}
                    onChange={e => matrix.updateCell(activeMusic, activeDim, { notes: e.target.value })}
                    placeholder="이 음악·차원에 대한 우리 전략 정리…&#10;예: 리드믹 걷기 = 또렷한 마르카토, 발끝 박자 정확하게, 뒤꿈치 내림 절제"
                    className="w-full mt-1 bg-tango-ink border border-tango-brass/30 rounded-sm px-3 py-2 text-tango-paper font-serif text-sm focus:outline-none focus:border-tango-brass min-h-[100px]"
                    style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                  />
                </div>

                {/* 영상 — 레퍼런스 */}
                <VideoSection
                  title="📚 참고 레퍼런스 영상"
                  desc="우승자/마에스트로 영상 — 닮고 싶은 모습"
                  videos={activeCell.reference_videos || []}
                  onAdd={(url, label) => matrix.addVideo(activeMusic, activeDim, 'reference', url, label)}
                  onRemove={(id) => matrix.removeVideo(activeMusic, activeDim, 'reference', id)}
                  accent="brass"
                />

                {/* 영상 — 우리 연습 */}
                <VideoSection
                  title="🎬 우리 연습 영상"
                  desc="실제 연습 결과 — 시간 흐름에 따른 발전"
                  videos={activeCell.own_videos || []}
                  onAdd={(url, label) => matrix.addVideo(activeMusic, activeDim, 'own', url, label)}
                  onRemove={(id) => matrix.removeVideo(activeMusic, activeDim, 'own', id)}
                  accent="rose"
                />

                {activeCell.updated_at && (
                  <div className="text-[10px] text-tango-cream/40 text-right font-sans">
                    수정: {new Date(activeCell.updated_at).toLocaleString()}
                  </div>
                )}
              </div>

              {/* 빠른 매트릭스 그리드 (전체 한눈) */}
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  Full Matrix · 전체 한눈
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-tango-brass/15 rounded-sm overflow-hidden">
                    <thead className="bg-tango-shadow/60">
                      <tr>
                        <th className="text-left px-2 py-2 font-sans text-[10px] tracking-widest uppercase text-tango-cream/60">음악 \ 차원</th>
                        {DIMENSIONS.map(d => (
                          <th key={d.key} className="text-center px-2 py-2 font-sans text-[10px] tracking-widest uppercase text-tango-cream/60">
                            {d.icon} {d.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MUSIC_TYPES.map(m => (
                        <tr key={m.key} className="border-t border-tango-brass/10">
                          <td className="px-2 py-2">
                            <div className="font-serif italic text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              {m.label}
                            </div>
                            <div className="text-[9px]" style={{ color: m.color }}>{m.sub}</div>
                          </td>
                          {DIMENSIONS.map(d => {
                            const c = matrix.data.cells[cellKey(m.key, d.key)];
                            const refs = c?.reference_videos?.length || 0;
                            const owns = c?.own_videos?.length || 0;
                            const hasNotes = !!c?.notes.trim();
                            return (
                              <td
                                key={d.key}
                                className={`text-center px-2 py-2 cursor-pointer hover:bg-tango-brass/10 ${
                                  activeMusic === m.key && activeDim === d.key ? 'bg-tango-brass/20' : ''
                                }`}
                                onClick={() => { setActiveMusic(m.key); setActiveDim(d.key); }}
                              >
                                {hasNotes || refs || owns ? (
                                  <div className="flex items-center justify-center gap-1">
                                    {hasNotes && <span className="text-tango-brass">●</span>}
                                    {refs > 0 && <span className="text-[10px] text-tango-brass">📚{refs}</span>}
                                    {owns > 0 && <span className="text-[10px] text-tango-rose">🎬{owns}</span>}
                                  </div>
                                ) : (
                                  <span className="text-tango-cream/20">·</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* === 분석 섹션 === */}
          {section === 'analysis' && (
            <div className="space-y-8">
              {/* 우리 분석 */}
              <section>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  Our Profile · 우리 부부 분석
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  우리의 <em className="text-tango-brass">강점</em>과 <em className="text-tango-rose">약점</em>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-tango-brass/10 border border-tango-brass/30 rounded-sm p-4">
                    <div className="text-[10px] tracking-widest uppercase text-tango-brass mb-2">★ 강점</div>
                    <ul className="space-y-2 text-sm font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {ourAnalysis.strengths.length === 0 ? (
                        <li className="text-tango-cream/50 italic">데이터를 입력하면 자동 분석</li>
                      ) : ourAnalysis.strengths.map((s, i) => (
                        <li key={i} className="text-tango-paper">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-tango-rose/10 border border-tango-rose/30 rounded-sm p-4">
                    <div className="text-[10px] tracking-widest uppercase text-tango-rose mb-2">✕ 약점</div>
                    <ul className="space-y-2 text-sm font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {ourAnalysis.weaknesses.length === 0 ? (
                        <li className="text-tango-cream/50 italic">데이터를 입력하면 자동 분석</li>
                      ) : ourAnalysis.weaknesses.map((w, i) => (
                        <li key={i} className="text-tango-paper">• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-xs text-tango-cream/50 text-center mt-3 font-serif italic">
                  자세한 분석 →{' '}
                  <Link to="/weakness" className="text-tango-brass hover:underline">/weakness</Link>{' · '}
                  <Link to="/command" className="text-tango-brass hover:underline">/command</Link>
                </div>
              </section>

              {/* 우승자 분석 */}
              <section>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  Champions · Mundial 우승자 패턴
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic mb-5" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  우승자들의 <em className="text-tango-brass">공통 패턴</em>
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4">
                    <div className="text-[10px] tracking-widest uppercase text-tango-brass mb-2">최근 5년 우승 커플</div>
                    <ul className="space-y-1.5 text-sm font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {championAnalysis.recent.map((c: any) => (
                        <li key={`${c.year}-${c.category}`} className="text-tango-paper italic">
                          <span className="text-tango-brass font-bold not-italic">{c.year} {c.category === 'pista' ? 'Pista' : 'Esc'}</span>
                          {' · '}{c.leader} & {c.follower}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-4">
                    <div className="text-[10px] tracking-widest uppercase text-tango-brass mb-2">우승자 공통 특성</div>
                    <ul className="space-y-2 text-sm font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {championAnalysis.traits.map((t, i) => (
                        <li key={i} className="text-tango-paper">✓ {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="text-xs text-tango-cream/50 text-center mt-3 font-serif italic">
                  전체 우승자 →{' '}
                  <Link to="/champions" className="text-tango-brass hover:underline">/champions</Link>{' · '}
                  <Link to="/mundial" className="text-tango-brass hover:underline">/mundial</Link>
                </div>
              </section>
            </div>
          )}

          {/* === 대회준비반 핵심 메모 === */}
          {section === 'notes' && (
            <div className="space-y-6">
              <section>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                  Music Phrasing · 프레이즈 구별
                </div>
                <h2 className="font-display text-xl md:text-2xl text-tango-paper italic mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  프레이즈 구별하기
                </h2>
                <textarea
                  value={matrix.data.phrasing_notes}
                  onChange={e => matrix.updatePhrasing(e.target.value)}
                  placeholder="프레이즈 단위 인식 · 8박 한 묶음, 음악적 마디 끊기, 호흡점…"
                  className="w-full bg-tango-shadow/40 border border-tango-brass/30 rounded-sm px-3 py-3 text-tango-paper font-serif text-sm focus:outline-none focus:border-tango-brass min-h-[100px]"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                />
              </section>

              <section>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                  Prep Class Notes · 대회준비반 핵심
                </div>
                <h2 className="font-display text-xl md:text-2xl text-tango-paper italic mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  대회준비반에서 배운 것
                </h2>
                <textarea
                  value={matrix.data.prep_class_notes}
                  onChange={e => matrix.updatePrepClass(e.target.value)}
                  placeholder="대회준비반 핵심 정리 · 강사 코멘트, 기억해야 할 원칙, 우리 부부에게 적용된 피드백…"
                  className="w-full bg-tango-shadow/40 border border-tango-brass/30 rounded-sm px-3 py-3 text-tango-paper font-serif text-sm focus:outline-none focus:border-tango-brass min-h-[200px]"
                  style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                />
              </section>

              {/* 커스텀 카테고리 */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                    Custom · 추가 영역
                  </div>
                  <button
                    onClick={() => {
                      const label = prompt('새 영역 이름 (예: 동선 전략, 멘탈, 의상)');
                      if (label?.trim()) matrix.addCustomCategory(label.trim());
                    }}
                    className="text-xs text-tango-brass hover:underline"
                  >
                    + 추가
                  </button>
                </div>
                {matrix.data.custom_categories.length === 0 ? (
                  <div className="text-xs text-tango-cream/40 italic font-serif text-center py-4">
                    필요하면 영역 추가 (예: 동선, 멘탈, 의상, 표정)
                  </div>
                ) : (
                  <div className="space-y-3">
                    {matrix.data.custom_categories.map(cat => (
                      <div key={cat.key} className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-3">
                        <div className="flex items-center justify-between mb-2">
                          <input
                            value={cat.label}
                            onChange={e => matrix.updateCustomCategory(cat.key, { label: e.target.value })}
                            className="bg-transparent border-none text-tango-paper font-serif italic text-base focus:outline-none flex-1"
                            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                          />
                          <button
                            onClick={() => confirm(`"${cat.label}" 삭제?`) && matrix.removeCustomCategory(cat.key)}
                            className="text-tango-cream/40 hover:text-tango-rose text-lg"
                          >
                            ×
                          </button>
                        </div>
                        <textarea
                          value={cat.notes}
                          onChange={e => matrix.updateCustomCategory(cat.key, { notes: e.target.value })}
                          placeholder="메모…"
                          className="w-full bg-tango-ink border border-tango-brass/20 rounded-sm px-3 py-2 text-tango-paper font-serif text-sm focus:outline-none focus:border-tango-brass min-h-[80px]"
                          style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          <OrnamentDivider className="pt-6" />
        </div>
      </div>
    </>
  );
}

// === 영상 섹션 컴포넌트 ===
function VideoSection({
  title,
  desc,
  videos,
  onAdd,
  onRemove,
  accent,
}: {
  title: string;
  desc: string;
  videos: VideoRef[];
  onAdd: (url: string, label?: string) => void;
  onRemove: (id: string) => void;
  accent: 'brass' | 'rose';
}) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  const accentColor = accent === 'brass' ? '#D4AF37' : '#C72C1C';

  const handleAdd = () => {
    if (!url.trim()) return;
    onAdd(url, label);
    setUrl('');
    setLabel('');
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <label className="text-[11px] tracking-widest uppercase font-sans" style={{ color: accentColor }}>
            {title}
          </label>
          <div className="text-[10px] text-tango-cream/50 font-serif italic">{desc}</div>
        </div>
        <span className="text-[10px] text-tango-cream/40">{videos.length}개</span>
      </div>

      {/* 입력 */}
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="YouTube / Instagram URL"
          className="flex-1 bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1.5 text-tango-paper text-xs focus:outline-none focus:border-tango-brass"
        />
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="라벨 (선택)"
          className="w-32 bg-tango-ink border border-tango-brass/30 rounded-sm px-2 py-1.5 text-tango-paper text-xs focus:outline-none focus:border-tango-brass"
        />
        <button
          onClick={handleAdd}
          disabled={!url.trim()}
          className="px-3 py-1.5 text-xs rounded-sm font-sans disabled:opacity-30"
          style={{ backgroundColor: `${accentColor}33`, color: accentColor }}
        >
          추가
        </button>
      </div>

      {/* 영상 목록 */}
      {videos.length === 0 ? (
        <div className="text-[10px] text-tango-cream/30 italic text-center py-2">
          아직 영상이 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {videos.map(v => {
            const embed = extractVideoEmbed(v.url);
            return (
              <div key={v.id} className="bg-tango-ink/50 border border-tango-brass/20 rounded-sm overflow-hidden">
                {embed.embedUrl ? (
                  <div className="relative bg-black" style={{ aspectRatio: '16 / 9' }}>
                    <iframe
                      src={embed.embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 text-xs text-tango-brass hover:underline truncate"
                  >
                    🔗 {v.url}
                  </a>
                )}
                <div className="p-2 flex items-center justify-between gap-2">
                  <div className="text-xs text-tango-cream/80 font-serif italic truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    {v.label || '(라벨 없음)'}
                  </div>
                  <button
                    onClick={() => confirm('영상 제거?') && onRemove(v.id)}
                    className="text-tango-cream/30 hover:text-tango-rose text-base flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// === 우리 분석 ===
function useOurAnalysis() {
  const { ownCompetitions } = useTrainingStore();

  return useMemo(() => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // KTC 데이터 분석
    const ktc = ktcData as any;
    const myRecords: any[] = [];
    for (const ev of Object.values(ktc.events)) {
      const e = ev as any;
      for (const c of e.couples || []) {
        if (c.is_my_couple || c.is_my_partner) {
          myRecords.push({ ...c, year: e.year, category: e.category, stage: e.stage, advanced: c.advanced });
        }
      }
    }

    // 부문별 평균
    const catScores: Record<string, number[]> = {};
    for (const r of myRecords) {
      if (!catScores[r.category]) catScores[r.category] = [];
      catScores[r.category].push(r.average);
    }
    const catAvgs = Object.entries(catScores).map(([cat, arr]) => ({
      cat, avg: arr.reduce((a, b) => a + b, 0) / arr.length, n: arr.length,
    })).sort((a, b) => b.avg - a.avg);

    if (catAvgs.length > 0) {
      const best = catAvgs[0];
      const catLabel: Record<string, string> = { pista: '피스타', milonga: '밀롱가', vals: '발스', pista_singles_jackandjill: '잭앤질' };
      strengths.push(`${catLabel[best.cat] || best.cat} 부문 평균 ${best.avg.toFixed(2)} (${best.n}회)`);
      if (catAvgs.length >= 2) {
        const worst = catAvgs[catAvgs.length - 1];
        weaknesses.push(`${catLabel[worst.cat] || worst.cat} 부문 평균 ${worst.avg.toFixed(2)} (${worst.n}회) — 보강 필요`);
      }
    }

    // 진출 경험
    const advanced = myRecords.filter(r => r.advanced).length;
    if (advanced > 0) {
      strengths.push(`결승 진출 ${advanced}회 — 본 무대 퍼포먼스 입증`);
    }

    // 사용자 입력 데이터
    if (ownCompetitions.length > 0) {
      const allScores = ownCompetitions.flatMap(c => c.scores.map((s: any) => s.total)).filter((s: number) => s > 0);
      if (allScores.length > 0) {
        const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        if (avg >= 8.3) strengths.push(`최근 평균 점수 ${avg.toFixed(2)} — 안정권`);
        else if (avg < 8.0) weaknesses.push(`최근 평균 ${avg.toFixed(2)} — 8.3 이상 목표`);
      }
    }

    return { strengths, weaknesses };
  }, [ownCompetitions]);
}

// === 우승자 분석 ===
function useChampionAnalysis() {
  return useMemo(() => {
    const data = champData as any;
    const champs = (data.champions || []).filter((c: any) => c.year >= 2021);

    const recent = champs.slice(0, 6).map((c: any) => ({
      year: c.year,
      category: c.category,
      leader: c.leader,
      follower: c.follower,
    }));

    const traits = [
      '아르헨티나 팀이 절대다수 — 정통성·아브라소 디테일 우위',
      '결승에서 클래식 라인 (Di Sarli, D\'Arienzo, Pugliese) 정확하게 해석',
      '4 라운드 내내 "안정된" 음악 해석 — 변주보다 일관성',
      '심사위원 시야에 자주 걸리는 동선 — 플로어 중심부 활용',
      '아브라소가 곡 시작부터 끝까지 무너지지 않음',
      '음악이 바뀌면 즉시 차원(걷기·아브라소 등)을 갈아끼움',
    ];

    return { recent, traits };
  }, []);
}
