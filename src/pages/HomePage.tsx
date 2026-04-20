// 에디토리얼 디자인 — The Pudding + Kinfolk + 탱고 빈티지
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { usePracticeStore } from '../hooks/usePracticeStore';
import { useRecentItems } from '../hooks/useRecentItems';
import { computeRankings } from '../utils/tangoRanking';

import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import roundsData from '../data/competition_rounds.json';

import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const rounds = (roundsData as any).rounds;

export function HomePage() {
  const navigate = useNavigate();
  const { boards, compareSessions } = usePracticeStore();
  const { recentItems } = useRecentItems();

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
    return rankings.slice(0, 6);
  }, []);

  const stats = useMemo(() => ({
    songs: songs.length,
    competitions: new Set(appearances.map(a => a.competition_id)).size,
    rounds: rounds.length,
    years: new Set(appearances.map(a => a.year)).size,
  }), []);

  const recentCompares = useMemo(() => compareSessions.slice(0, 3), [compareSessions]);

  return (
    <>
      <PageHeader title="석정소유의 탱고랩" />
      <div className="flex-1 overflow-y-auto bg-tango-ink text-tango-paper">

        {/* ╔══════════ HERO — 에디토리얼 매거진 ══════════╗ */}
        <section className="relative overflow-hidden">
          {/* 배경 그라디언트 (아르데코 빈티지) */}
          <div className="absolute inset-0 bg-gradient-to-br from-tango-shadow via-tango-ink to-tango-burgundy/20 pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M 0,20 L 40,20 M 20,0 L 20,40' stroke='%23C8A44E' stroke-width='0.5' /%3E%3C/svg%3E\")",
          }} />

          <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-4 animate-fade-in-up">
                Vol. 001 · {new Date().getFullYear()}
              </div>
              <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl text-tango-paper leading-[0.9] mb-4 animate-fade-in-up" style={{ fontFamily: '"Playfair Display", serif' }}>
                석정소유의
                <br />
                <em className="italic text-tango-brass">Tango Lab</em>
              </h1>
              <div className="flex items-center justify-center gap-4 my-6">
                <div className="h-px w-16 bg-tango-brass/60"></div>
                <span className="text-tango-brass text-lg">◈</span>
                <div className="h-px w-16 bg-tango-brass/60"></div>
              </div>
              <p className="font-serif text-base md:text-lg text-tango-cream/70 italic max-w-xl mx-auto leading-relaxed">
                대회곡 아카이브, 탄다 분석, 전략 메모 — 한 권의 매거진처럼 정리된 탱고 연구실.
              </p>
            </div>

            {/* 통계 그리드 (The Pudding 스타일) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16">
              <StatCard value={stats.songs} label="곡 아카이브" />
              <StatCard value={stats.competitions} label="주요 대회" />
              <StatCard value={stats.rounds} label="경기 라운드" />
              <StatCard value={`${stats.years}년`} label="역사" />
            </div>
          </div>
        </section>

        {/* ╔══════════ 검색바 — 빈티지 스타일 ══════════╗ */}
        <section className="relative border-y border-tango-brass/20 bg-tango-shadow/60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="곡, 악단, 보컬리스트 검색…"
                className="w-full bg-transparent border-0 border-b-2 border-tango-brass/30 focus:border-tango-brass pb-2 pt-1 pl-8 font-serif text-lg text-tango-paper placeholder-tango-cream/30 focus:outline-none transition-colors"
              />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tango-brass">◈</span>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-tango-shadow border border-tango-brass/20 rounded-sm shadow-2xl z-20 max-h-80 overflow-y-auto">
                  {searchResults.map(s => (
                    <button
                      key={s.song_id}
                      onClick={() => { navigate(`/song/${s.song_id}`); setSearchQuery(''); }}
                      className="w-full text-left px-5 py-3 hover:bg-tango-brass/10 transition-colors border-b border-tango-brass/10 last:border-0"
                    >
                      <div className="font-serif text-tango-paper">{s.title}</div>
                      <div className="text-xs text-tango-cream/50 mt-0.5 font-sans">
                        {s.orchestra || '오케스트라 미확인'}
                        {s.vocalist && <span className="text-tango-rose"> · {s.vocalist}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ╔══════════ 피처 섹션 (Magazine Grid) ══════════╗ */}
        <section className="max-w-5xl mx-auto px-6 py-16">

          {/* 섹션 헤더 */}
          <EditorialHeader
            eyebrow="FEATURED · No. 01"
            title="오늘의 아카이브"
            subtitle="자주 찾으시는 곳으로 바로 이동하세요"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-tango-brass/15 mt-8 rounded-sm overflow-hidden">
            <FeatureCell to="/songs" num="01" title="Songs" subtitle="곡 아카이브" desc={`${stats.songs}곡의 대회 이력`} />
            <FeatureCell to="/orchestra" num="02" title="Orchestras" subtitle="악단 연구" desc="스타일·조합 분석" />
            <FeatureCell to="/tanda" num="03" title="Tandas" subtitle="탄다 연구소" desc="3곡 조합 패턴" />
            <FeatureCell to="/trends" num="04" title="Trends" subtitle="트렌드 분석" desc="연대기·히트맵" />
            <FeatureCell to="/ai" num="05" title="AI" subtitle="탄다 추천" desc="맞춤 3곡 설계" />
            <FeatureCell to="/quiz" num="06" title="Quiz" subtitle="곡 맞추기" desc="듣고 악단 맞춰" />
            <FeatureCell to="/notes" num="07" title="Notes" subtitle="공유 메모판" desc="둘이 함께 쓰기" />
            <FeatureCell to="/my-competitions" num="08" title="Records" subtitle="내 대회 기록" desc="점수·심사위원" />
          </div>
        </section>

        {/* ╔══════════ 추천 곡 — 매거진 리스트 ══════════╗ */}
        <section className="bg-gradient-to-b from-transparent via-tango-burgundy/5 to-transparent">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <EditorialHeader
              eyebrow="RANKED · No. 02"
              title="대회 출현 TOP 6"
              subtitle="결승 가중치 기반 순위"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 mt-10">
              {recommended.map((r, i) => (
                <Link
                  key={r.song_id}
                  to={`/song/${r.song_id}`}
                  className="group flex items-start gap-5 py-5 border-b border-tango-brass/15 hover:bg-tango-brass/5 px-3 -mx-3 transition-colors"
                >
                  <span className="font-display text-4xl text-tango-brass/60 leading-none w-12 flex-shrink-0" style={{ fontFamily: '"Playfair Display", serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-xl text-tango-paper group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                      {r.title}
                    </h3>
                    <p className="text-[11px] tracking-wider uppercase text-tango-cream/50 font-sans mt-0.5 truncate">
                      {r.orchestra || '미상'}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-sans">
                      <span className="text-tango-brass font-semibold">{r.total_appearances}회</span>
                      {r.final_count > 0 && (
                        <span className="text-tango-rose">결승 {r.final_count}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ╔══════════ 최근 본 항목 / 보드 (있을 때만) ══════════╗ */}
        {(recentItems.length > 0 || boards.length > 0 || recentCompares.length > 0) && (
          <section className="max-w-5xl mx-auto px-6 py-16">
            <EditorialHeader
              eyebrow="RECENT · No. 03"
              title="최근 활동"
              subtitle="마지막으로 작업한 것들"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              {/* 최근 본 곡 */}
              {recentItems.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-[0.2em] uppercase text-tango-brass mb-4 font-sans">최근 본 곡</h4>
                  <div className="space-y-3">
                    {recentItems.slice(0, 4).map(item => (
                      <Link
                        key={item.id}
                        to={`/song/${item.id}`}
                        className="block font-serif text-tango-paper hover:text-tango-brass transition-colors"
                        style={{ fontFamily: '"Cormorant Garamond", serif' }}
                      >
                        <div className="italic">{item.title}</div>
                        <div className="text-xs text-tango-cream/40 font-sans not-italic">{item.subtitle}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 연습 보드 */}
              {boards.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-[0.2em] uppercase text-tango-brass mb-4 font-sans">연습 보드</h4>
                  <div className="space-y-3">
                    {boards.slice(0, 4).map(b => (
                      <Link
                        key={b.id}
                        to={`/practice/${b.id}`}
                        className="block font-serif text-tango-paper hover:text-tango-brass transition-colors"
                        style={{ fontFamily: '"Cormorant Garamond", serif' }}
                      >
                        <div className="italic">{b.title}</div>
                        <div className="text-xs text-tango-cream/40 font-sans not-italic">{b.song_ids.length}곡</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 최근 비교 */}
              {recentCompares.length > 0 && (
                <div>
                  <h4 className="text-[10px] tracking-[0.2em] uppercase text-tango-brass mb-4 font-sans">비교 세션</h4>
                  <div className="space-y-3">
                    {recentCompares.map(s => (
                      <Link
                        key={s.id}
                        to={`/compare/${s.id}`}
                        className="block font-serif text-tango-paper hover:text-tango-brass transition-colors"
                        style={{ fontFamily: '"Cormorant Garamond", serif' }}
                      >
                        <div className="italic">{s.title}</div>
                        <div className="text-xs text-tango-cream/40 font-sans not-italic">
                          체크 {s.checklist.filter(c => c.checked).length}/{s.checklist.length}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ╔══════════ 푸터 ══════════╗ */}
        <footer className="border-t border-tango-brass/20 py-12 text-center">
          <div className="text-tango-brass text-lg mb-3">◈◈◈</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-cream/40 font-sans">
            Seokjeong Soyou · Tango Archive
          </div>
        </footer>

        {/* 하단 여백 (모바일 탭) */}
        <div className="h-4" />
      </div>
    </>
  );
}

/* ═══════ 컴포넌트 ═══════ */

function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="text-center md:text-left border-l-2 border-tango-brass/40 pl-4 py-2">
      <div className="font-display text-4xl md:text-5xl text-tango-brass font-bold leading-none" style={{ fontFamily: '"Playfair Display", serif' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-tango-cream/60 mt-2 font-sans">
        {label}
      </div>
    </div>
  );
}

function EditorialHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center border-b border-tango-brass/20 pb-8">
      <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
        {eyebrow}
      </div>
      <h2 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", serif' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">{subtitle}</p>
      )}
    </div>
  );
}

function FeatureCell({ to, num, title, subtitle, desc }: { to: string; num: string; title: string; subtitle: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group block bg-tango-ink hover:bg-tango-shadow p-6 md:p-8 transition-all min-h-[180px] flex flex-col justify-between"
    >
      <div className="text-[11px] tracking-[0.25em] uppercase text-tango-brass/80 font-sans">
        No. {num}
      </div>
      <div>
        <h3 className="font-display text-3xl text-tango-paper italic group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Playfair Display", serif' }}>
          {title}
        </h3>
        <div className="text-sm text-tango-cream/70 font-serif italic mt-1">{subtitle}</div>
        <div className="text-[11px] text-tango-cream/40 font-sans mt-3">{desc}</div>
      </div>
    </Link>
  );
}
