// 에디토리얼 매거진 표지 스타일 — Cover Story (A+B 하이브리드)
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { TodayInHistoryWidget } from '../components/DailyTandaWidget';
import { usePracticeStore } from '../hooks/usePracticeStore';
import { useRecentItems } from '../hooks/useRecentItems';
import { computeRankings } from '../utils/tangoRanking';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import { isPerformanceVideo, sortVideosByPriority } from '../utils/videoTypes';

import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import roundsData from '../data/competition_rounds.json';

import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const rounds = (roundsData as any).rounds;

// 오늘 날짜 기반 결정적 탄다 선택 — 🎥 실제 대회 영상 있는 라운드만
function pickDailyTanda() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const eligible = rounds.filter((r: any) =>
    r.songs?.length >= 3 &&
    (r.videos || []).some((v: any) => isPerformanceVideo(v))
  );
  if (eligible.length === 0) return null;
  const picked = eligible[seed % eligible.length];
  // 퍼포먼스 영상 우선 정렬
  return { ...picked, videos: sortVideosByPriority(picked.videos || []).filter((v: any) => isPerformanceVideo(v)) };
}

export function HomePage() {
  const navigate = useNavigate();
  const { boards, compareSessions } = usePracticeStore();
  const { recentItems } = useRecentItems();
  const [showVideo, setShowVideo] = useState(false);

  const dailyTanda = useMemo(() => pickDailyTanda(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return songs
      .filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.orchestra?.toLowerCase().includes(q) ||
        s.vocalist?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [searchQuery]);

  const recommended = useMemo(() => {
    const rankings = computeRankings(songs, appearances);
    return rankings.slice(0, 5);
  }, []);

  const stats = useMemo(() => ({
    songs: songs.length,
    rounds: rounds.length,
    years: new Set(appearances.map(a => a.year)).size,
  }), []);

  const recentCompares = useMemo(() => compareSessions.slice(0, 2), [compareSessions]);

  const today = new Date();
  const issueDate = `${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][today.getMonth()]} ${today.getFullYear()}`;
  const stageLabel = dailyTanda?.stage === 'final' ? '결승'
    : dailyTanda?.stage === 'semifinal' ? '준결승'
    : dailyTanda?.stage === 'quarterfinal' ? '8강' : '예선';

  const videoId = dailyTanda?.videos?.[0]?.video_id;

  return (
    <>
      <PageHeader title="석정소유의 탱고랩" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">

        {/* ╔══════════ HERO COVER STORY ══════════╗ */}
        <section className="relative min-h-[75vh] md:min-h-[calc(100vh-56px)] overflow-hidden">
          {/* 배경 영상 (auto-play 대신 블러드 썸네일 + 클릭시 재생) */}
          <div className="absolute inset-0 bg-gradient-to-br from-tango-burgundy/30 via-tango-shadow to-tango-ink pointer-events-none" />

          {/* 빈티지 그리드 텍스처 */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M 0,30 L 60,30 M 30,0 L 30,60' stroke='%23C8A44E' stroke-width='0.4' /%3E%3C/svg%3E\")",
          }} />

          {/* 배경 블러 영상 (비디오가 있을 때) */}
          {videoId && !showVideo && (
            <div className="absolute inset-0 overflow-hidden opacity-25">
              <img
                src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                alt=""
                className="w-full h-full object-cover scale-110"
                style={{ filter: 'blur(8px) grayscale(0.4) sepia(0.3)' }}
                loading="eager"
              />
            </div>
          )}

          {/* 매거진 마스트헤드 (최상단) */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 md:px-12 py-5 text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans z-10">
            <div className="flex items-center gap-4">
              <span>Vol. 001</span>
              <span className="h-3 w-px bg-tango-brass/40"></span>
              <span>{issueDate}</span>
            </div>
            <div className="hidden md:block">석정소유의 탱고랩</div>
          </div>

          {/* 메인 커버 콘텐츠 */}
          <div className="relative z-10 flex flex-col min-h-[75vh] md:min-h-[calc(100vh-56px)] justify-center max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24">
            {dailyTanda ? (
              <>
                {/* Eyebrow */}
                <div className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-tango-brass font-sans mb-6 md:mb-10 animate-fade-in-up">
                  — Today's Tanda · Cover Story —
                </div>

                {/* 대형 헤드라인 */}
                <h1
                  className="font-display text-tango-paper leading-[0.88] italic mb-6 md:mb-10 animate-fade-in-up"
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: 'clamp(3rem, 8vw, 7rem)',
                    fontWeight: 700,
                  }}
                >
                  오늘 우리가
                  <br />
                  <em className="text-tango-brass">들어야 할</em>
                  <br />
                  세 곡
                </h1>

                {/* 3곡 리드 */}
                <div className="mb-8 md:mb-12 animate-fade-in-up">
                  <div className="flex items-center gap-4 text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-tango-cream/60 font-sans mb-4">
                    <span>{dailyTanda.competition} {dailyTanda.year}</span>
                    <span>·</span>
                    <span>{stageLabel}</span>
                    <span>·</span>
                    <span>Ronda {dailyTanda.ronda_number}</span>
                  </div>
                  <div className="space-y-2">
                    {dailyTanda.songs.slice(0, 3).map((s: any, i: number) => (
                      <Link
                        key={s.song_id || i}
                        to={s.song_id ? `/song/${s.song_id}` : '#'}
                        className="group flex items-baseline gap-4 hover:translate-x-1 transition-transform"
                      >
                        <span className="font-display text-xl md:text-2xl text-tango-brass/50 italic flex-shrink-0 w-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-serif italic text-2xl md:text-3xl text-tango-paper group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {s.title}
                          </span>
                          <span className="ml-3 text-[10px] md:text-xs tracking-wider uppercase text-tango-cream/40 font-sans">
                            {shortOrchestraName(s.orchestra || '')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 장식 구분 */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px w-12 bg-tango-brass/50"></div>
                  <span className="text-tango-brass text-sm">◈ ◈ ◈</span>
                  <div className="h-px flex-1 bg-tango-brass/30"></div>
                </div>

                {/* CTA */}
                {videoId && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="inline-flex items-center gap-3 self-start px-6 py-3 bg-tango-brass/10 hover:bg-tango-brass text-tango-brass hover:text-tango-ink border border-tango-brass transition-all group"
                  >
                    <span className="text-xl">{showVideo ? '✕' : '▶'}</span>
                    <span className="font-serif italic text-lg" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {showVideo ? '영상 닫기' : '영상으로 감상하기'}
                    </span>
                  </button>
                )}

                {/* 영상 (클릭시 표시) */}
                {showVideo && videoId && (
                  <div className="mt-8 relative w-full rounded-sm overflow-hidden border border-tango-brass/30 shadow-2xl animate-fade-in-up" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                      title={`Today's Tanda ${dailyTanda.year}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <h1 className="font-display text-6xl md:text-8xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  Tango <em className="text-tango-brass">Lab</em>
                </h1>
              </div>
            )}
          </div>

          {/* 스크롤 유도 (하단) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-tango-brass/60 animate-pulse">
            <div className="text-[9px] tracking-[0.3em] uppercase text-center mb-1">Scroll</div>
            <div className="text-center">↓</div>
          </div>
        </section>

        {/* ╔══════════ 간결한 통계 스트립 ══════════╗ */}
        <section className="border-y border-tango-brass/20 bg-tango-shadow/50">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-4 flex flex-wrap items-center justify-center md:justify-between gap-4 text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans italic">
              소유 · 신랑 · Mundial 우승 도전 랩실
            </div>
          </div>
        </section>

        {/* 우승 전략 진입 */}
        <section className="border-y border-tango-brass/20 bg-tango-burgundy/5">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-6 flex flex-wrap items-center justify-center md:justify-between gap-6 text-center">
            <div>
              <span className="font-display text-2xl md:text-3xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {stats.songs.toLocaleString()}
              </span>
              <span className="ml-2 text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">Songs</span>
            </div>
            <div className="h-6 w-px bg-tango-brass/30 hidden md:block"></div>
            <div>
              <span className="font-display text-2xl md:text-3xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {stats.rounds}
              </span>
              <span className="ml-2 text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">Rounds</span>
            </div>
            <div className="h-6 w-px bg-tango-brass/30 hidden md:block"></div>
            <div>
              <span className="font-display text-2xl md:text-3xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {stats.years}<span className="text-lg">년</span>
              </span>
              <span className="ml-2 text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">Span</span>
            </div>
            <div className="h-6 w-px bg-tango-brass/30 hidden md:block"></div>
            <form onSubmit={(e) => { e.preventDefault(); if (searchResults[0]) navigate(`/song/${searchResults[0].song_id}`); }} className="relative flex-1 min-w-[200px] max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색…"
                className="w-full bg-transparent border-b border-tango-brass/30 focus:border-tango-brass pb-1 pt-0.5 pl-6 font-serif italic text-base text-tango-paper placeholder-tango-cream/30 focus:outline-none"
                style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tango-brass text-sm">◈</span>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-tango-shadow border border-tango-brass/20 rounded-sm shadow-2xl z-20 max-h-64 overflow-y-auto text-left">
                  {searchResults.slice(0, 5).map(s => (
                    <button
                      key={s.song_id}
                      type="button"
                      onClick={() => { navigate(`/song/${s.song_id}`); setSearchQuery(''); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-tango-brass/10 border-b border-tango-brass/10 last:border-0 transition-colors"
                    >
                      <div className="font-serif text-tango-paper text-sm truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{s.title}</div>
                      <div className="text-[10px] text-tango-cream/50 truncate font-sans">{s.orchestra || '미상'}</div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* ╔══════════ 목차 (TOC) ══════════╗ */}
        <section className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24">
          <div className="mb-8 md:mb-12">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              — Contents —
            </div>
            <h2 className="font-display text-3xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              이번 호 <em className="text-tango-brass">목차</em>
            </h2>
          </div>

          {/* 우승 전략 특집 — 큰 카드 */}
          <Link
            to="/champions"
            className="block bg-gradient-to-br from-tango-burgundy/30 via-tango-shadow to-tango-ink border border-tango-brass/40 hover:border-tango-brass rounded-sm p-6 md:p-8 mb-8 group transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                  ★ FEATURED · Strategy
                </div>
                <h3 className="font-display text-2xl md:text-4xl text-tango-paper italic group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  우승자는 <em className="text-tango-brass">무엇을</em> 춤췄는가
                </h3>
                <p className="font-serif italic text-sm md:text-base text-tango-cream/70 mt-2 max-w-xl" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  Mundial 결승 곡·악단 패턴. 우승자들의 공통점. 나의 전략 설계용 데이터.
                </p>
              </div>
              <span className="text-tango-brass text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
            <TocItem num="01" title="Trends" korean="트렌드 분석" desc="2012-2025 악단 변천사 스트림그래프" to="/trends" />
            <TocItem num="02" title="Tandas" korean="탄다 연구소" desc="3곡 조합 · AI 해설 · 에너지 패턴" to="/tanda" />
            <TocItem num="03" title="Orchestras" korean="악단 연구" desc="골든에이지 거장 15인" to="/orchestra" />
            <TocItem num="04" title="Songs" korean="곡 아카이브" desc="638곡의 대회 이력" to="/songs" />
            <TocItem num="05" title="AI" korean="AI 탄다 추천" desc="Gemini가 설계하는 3곡" to="/ai" />
            <TocItem num="06" title="Quiz" korean="곡 퀴즈" desc="듣고 악단 맞추기" to="/quiz" />
            <TocItem num="07" title="Mundial Story" korean="롱폼 기사" desc="매년의 결승을 읽다" to="/mundial/2024" />
            <TocItem num="08" title="My Records" korean="내 대회 기록" desc="점수 · 심사위원 · 영상" to="/my-competitions" />
          </div>
        </section>

        {/* ╔══════════ 추천 TOP 5 — 매거진 목록형 ══════════╗ */}
        <section className="border-t border-tango-brass/15 bg-gradient-to-b from-transparent via-tango-burgundy/[0.03] to-transparent">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-16 md:py-24">
            <div className="mb-8 md:mb-12 flex items-end justify-between flex-wrap gap-4">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  — Ranked ·  Feature No. 02 —
                </div>
                <h2 className="font-display text-3xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  이번 달의 <em className="text-tango-brass">베스트 5</em>
                </h2>
              </div>
              <Link to="/songs" className="text-[11px] tracking-widest uppercase text-tango-brass hover:text-tango-paper transition-colors font-sans">
                전체 아카이브 →
              </Link>
            </div>

            <div className="space-y-0">
              {recommended.map((r, i) => (
                <Link
                  key={r.song_id}
                  to={`/song/${r.song_id}`}
                  className="group grid grid-cols-[60px_1fr_auto] md:grid-cols-[80px_1fr_auto] items-baseline gap-4 md:gap-6 py-5 md:py-6 border-b border-tango-brass/15 hover:bg-tango-brass/[0.03] px-3 -mx-3 transition-colors"
                >
                  <span className="font-display text-3xl md:text-5xl text-tango-brass/50 group-hover:text-tango-brass italic leading-none transition-colors" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl md:text-3xl text-tango-paper italic leading-tight group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {r.title}
                    </h3>
                    <p className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-tango-cream/50 font-sans mt-1 truncate">
                      {r.orchestra || '미상'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-display text-lg md:text-2xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {r.total_appearances}
                    </div>
                    <div className="text-[9px] md:text-[10px] tracking-widest uppercase text-tango-cream/40 font-sans">
                      출현
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ╔══════════ 오늘의 Mundial 역사 ══════════╗ */}
        <section className="border-t border-tango-brass/15">
          <div className="max-w-5xl mx-auto px-6 md:px-12 py-16">
            <TodayInHistoryWidget />
          </div>
        </section>

        {/* ╔══════════ 최근 활동 (있을 때만) ══════════╗ */}
        {(recentItems.length > 0 || boards.length > 0 || recentCompares.length > 0) && (
          <section className="border-t border-tango-brass/15">
            <div className="max-w-5xl mx-auto px-6 md:px-12 py-16">
              <div className="mb-8">
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                  — Recent · Your Notes —
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  내 <em className="text-tango-brass">서재</em>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {recentItems.length > 0 && (
                  <div>
                    <h4 className="text-[10px] tracking-[0.25em] uppercase text-tango-brass/80 mb-4 font-sans">최근 본 곡</h4>
                    <div className="space-y-3">
                      {recentItems.slice(0, 3).map(item => (
                        <Link
                          key={item.id}
                          to={`/song/${item.id}`}
                          className="block hover:translate-x-1 transition-transform"
                        >
                          <div className="font-serif italic text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {item.title}
                          </div>
                          <div className="text-[10px] text-tango-cream/40 font-sans">{item.subtitle}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {boards.length > 0 && (
                  <div>
                    <h4 className="text-[10px] tracking-[0.25em] uppercase text-tango-brass/80 mb-4 font-sans">연습 보드</h4>
                    <div className="space-y-3">
                      {boards.slice(0, 3).map(b => (
                        <Link key={b.id} to={`/practice/${b.id}`} className="block hover:translate-x-1 transition-transform">
                          <div className="font-serif italic text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {b.title}
                          </div>
                          <div className="text-[10px] text-tango-cream/40 font-sans">{b.song_ids.length}곡</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {recentCompares.length > 0 && (
                  <div>
                    <h4 className="text-[10px] tracking-[0.25em] uppercase text-tango-brass/80 mb-4 font-sans">비교 세션</h4>
                    <div className="space-y-3">
                      {recentCompares.map(s => (
                        <Link key={s.id} to={`/compare/${s.id}`} className="block hover:translate-x-1 transition-transform">
                          <div className="font-serif italic text-lg text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {s.title}
                          </div>
                          <div className="text-[10px] text-tango-cream/40 font-sans">
                            체크 {s.checklist.filter(c => c.checked).length}/{s.checklist.length}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ╔══════════ 매거진 푸터 ══════════╗ */}
        <footer className="border-t border-tango-brass/20 py-12 md:py-16">
          <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
            <div className="text-tango-brass text-lg mb-4">◈ ◈ ◈</div>
            <div className="font-display italic text-xl text-tango-paper mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              석정소유의 Tango Lab
            </div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-cream/40 font-sans">
              Vol. 001 · {issueDate} · A tango magazine
            </div>
          </div>
        </footer>

        <div className="h-4" />
      </div>
    </>
  );
}

/* ═══════ 컴포넌트 ═══════ */

function TocItem({ num, title, korean, desc, to }: { num: string; title: string; korean: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="group grid grid-cols-[40px_1fr] items-baseline gap-4 py-5 border-b border-tango-brass/15 hover:bg-tango-brass/[0.03] px-3 -mx-3 transition-colors"
    >
      <span className="font-display text-2xl text-tango-brass/50 group-hover:text-tango-brass italic transition-colors leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {num}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="font-display text-xl md:text-2xl text-tango-paper italic group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            {title}
          </h3>
          <span className="text-[11px] tracking-wider uppercase text-tango-cream/50 font-sans">
            {korean}
          </span>
        </div>
        <p className="text-[11px] text-tango-cream/50 font-sans mt-1">
          {desc}
        </p>
      </div>
    </Link>
  );
}
