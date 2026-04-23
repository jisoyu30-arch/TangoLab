// 역대 우승자 분석 — Mundial 챔피언이 춤춘 곡·악단·패턴
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { TrendInsight } from '../components/TrendInsight';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import { isPerformanceVideo } from '../utils/videoTypes';
import roundsData from '../data/competition_rounds.json';
import songsData from '../data/songs.json';
import championsHistory from '../data/mundial_champions_history.json';
import championProfiles from '../data/champion_profiles.json';
import type { Song } from '../types/tango';

const songs = songsData as Song[];
const rounds = (roundsData as any).rounds;
const songMap = new Map(songs.map(s => [s.song_id, s]));

// 역대 우승자 — Wikipedia 기반 (2003~2025)
interface ChampionEntry {
  year: number;
  category: 'pista' | 'escenario';
  leader: string;
  follower: string;
  country: string;
}
const ALL_CHAMPIONS = championsHistory.champions as ChampionEntry[];

interface ChampionProfile {
  year: number;
  category: string;
  couple: string;
  origin: string;
  style_summary: string;
  characteristics: string[];
  strategic_takeaway: string;
  teaching_activity?: string;
  key_quote?: string;
  music_preference?: string;
  notable_history?: string;
  links?: string[];
}
const PROFILES = (championProfiles as any).profiles as Record<string, ChampionProfile>;
const PATTERN_INSIGHTS = (championProfiles as any).pattern_insights as string[];

function getProfile(year: number): ChampionProfile | null {
  // 프로필 key는 "2025-pista", "2024-pista" 형태
  return PROFILES[`${year}-pista`] ?? null;
}

// 현 심사위원 중 전 우승자 탐지용
const CURRENT_JUDGES_WHO_WON = [
  'Cristina Sosa', 'Daniel Nacucchio', 'Dante Sánchez', 'Dante Sanchez',
  'Inés Muzzopappa', 'Ines Muzzopappa',
  'Moira Castellano', 'Facundo de la Cruz', 'Jimena Hoeffner',
  'Diego Ortega', 'María Inés Bogado', 'Maria Ines Bogado',
];

function championBadge(leader: string, follower: string): string | null {
  const name1 = leader.toLowerCase();
  const name2 = follower.toLowerCase();
  for (const j of CURRENT_JUDGES_WHO_WON) {
    const jn = j.toLowerCase();
    if (name1.includes(jn) || name2.includes(jn) || jn.includes(name1) || jn.includes(name2)) {
      return `🎓 현 심사위원`;
    }
  }
  return null;
}

export function ChampionsPage() {
  const [selectedProfile, setSelectedProfile] = useState<ChampionProfile | null>(null);

  const analysis = useMemo(() => {
    // 결승 곡 전체
    const finalSongs: Array<{ year: number; song_id: string; title: string; orchestra: string; order: number }> = [];
    const finalRoundsData = rounds.filter((r: any) => r.competition === 'Mundial' && r.stage === 'final' && r.songs?.length > 0);

    for (const r of finalRoundsData) {
      for (const s of r.songs) {
        finalSongs.push({ year: r.year, ...s });
      }
    }

    // 악단별 빈도
    const orchFreq: Record<string, number> = {};
    const songFreq: Record<string, { count: number; song: Song | undefined }> = {};

    for (const s of finalSongs) {
      const o = shortOrchestraName(s.orchestra || '');
      if (o && o !== '?') orchFreq[o] = (orchFreq[o] || 0) + 1;
      if (s.song_id) {
        if (!songFreq[s.song_id]) songFreq[s.song_id] = { count: 0, song: songMap.get(s.song_id) };
        songFreq[s.song_id].count++;
      }
    }

    const topOrchs = Object.entries(orchFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topSongs = Object.entries(songFreq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, d]) => ({ song_id: id, count: d.count, song: d.song }));

    // 포지션별 악단 (1번째/2번째/3번째)
    const positionFreq: Record<string, { pos1: number; pos2: number; pos3: number }> = {};
    for (const s of finalSongs) {
      const o = shortOrchestraName(s.orchestra || '');
      if (!o || o === '?') continue;
      if (!positionFreq[o]) positionFreq[o] = { pos1: 0, pos2: 0, pos3: 0 };
      if (s.order === 1) positionFreq[o].pos1++;
      else if (s.order === 2) positionFreq[o].pos2++;
      else if (s.order === 3) positionFreq[o].pos3++;
    }

    // 결승 퍼포먼스 영상 (대회 영상만)
    const perfVideos = finalRoundsData
      .flatMap((r: any) =>
        (r.videos || [])
          .filter((v: any) => isPerformanceVideo(v))
          .map((v: any) => ({ ...v, year: r.year, ronda: r.ronda_number }))
      )
      .slice(0, 12);

    return { topOrchs, topSongs, positionFreq, totalFinalRondas: finalRoundsData.length, perfVideos, finalSongs };
  }, []);

  // Pista 우승자 연도 역순
  const pistaChampions = useMemo(
    () => ALL_CHAMPIONS.filter(c => c.category === 'pista').sort((a, b) => b.year - a.year),
    []
  );

  // 국적별 통계
  const countryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const c of pistaChampions) {
      const main = c.country.split('/')[0].trim();
      stats[main] = (stats[main] || 0) + 1;
    }
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [pistaChampions]);

  // 중복 우승자 탐지
  const multipleWins = useMemo(() => {
    const counts: Record<string, { name: string; years: number[]; categories: string[] }> = {};
    for (const c of ALL_CHAMPIONS) {
      for (const name of [c.leader, c.follower]) {
        if (!counts[name]) counts[name] = { name, years: [], categories: [] };
        counts[name].years.push(c.year);
        counts[name].categories.push(c.category);
      }
    }
    return Object.values(counts).filter(x => x.years.length >= 2).sort((a, b) => b.years.length - a.years.length);
  }, []);

  return (
    <>
      <PageHeader title="우승자 분석" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-12">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Strategy · Champion Analysis
            </div>
            <h1 className="font-display text-4xl md:text-6xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              우승자는 <em className="text-tango-brass">무엇을</em> 춤췄는가
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic max-w-2xl mx-auto">
              Mundial 결승 곡·악단 패턴 분석 — 우승 전략을 위한 데이터
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 역대 챔피언 — Pista 2003~2025 */}
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
                  Hall of Champions
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  Pista 역대 우승자 · <em className="text-tango-brass">{pistaChampions.length}팀</em>
                </h2>
              </div>
              <div className="text-right text-[10px] tracking-widest uppercase text-tango-cream/50">
                2003–2025
              </div>
            </div>

            {/* 국가별 분포 */}
            <div className="mb-6 bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4">
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/60 font-sans mb-2">
                국가별 우승 분포
              </div>
              <div className="flex flex-wrap gap-2">
                {countryStats.map(([country, count]) => (
                  <div key={country} className="bg-tango-ink border border-tango-brass/25 rounded-sm px-3 py-1.5">
                    <span className="font-serif italic text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {country}
                    </span>
                    <span className="text-tango-brass font-semibold ml-2">{count}회</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pistaChampions.map(c => {
                const badge = championBadge(c.leader, c.follower);
                const profile = getProfile(c.year);
                const isRecent = c.year >= 2022;
                return (
                  <button
                    key={`${c.year}-${c.category}`}
                    onClick={() => profile ? setSelectedProfile(profile) : null}
                    disabled={!profile}
                    className={`relative border rounded-sm p-4 transition-all group text-left ${
                      isRecent
                        ? 'bg-gradient-to-br from-tango-brass/10 via-tango-shadow to-tango-ink border-tango-brass/40 hover:border-tango-brass'
                        : 'bg-tango-shadow/50 border-tango-brass/15 hover:border-tango-brass/30'
                    } ${profile ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className={`font-display font-bold italic leading-none ${isRecent ? 'text-3xl text-tango-brass' : 'text-2xl text-tango-brass/70'}`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                        {c.year}
                      </span>
                      <span className="text-[9px] tracking-widest uppercase text-tango-cream/50 font-sans">
                        {c.country}
                      </span>
                    </div>
                    <h3 className="font-display italic text-base text-tango-paper group-hover:text-tango-brass transition-colors leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {c.leader}
                    </h3>
                    <p className="font-serif italic text-[13px] text-tango-cream/70 mt-0.5 truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      & {c.follower}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {badge && (
                        <div className="text-[9px] px-1.5 py-0.5 inline-block bg-tango-brass/20 text-tango-brass rounded-sm border border-tango-brass/40">
                          {badge}
                        </div>
                      )}
                      {profile && (
                        <div className="text-[9px] px-1.5 py-0.5 inline-block bg-tango-rose/15 text-tango-rose rounded-sm border border-tango-rose/30">
                          📖 분석 있음
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              <div className="relative border border-dashed border-white/10 rounded-sm p-4 flex flex-col items-center justify-center text-tango-cream/40">
                <div className="font-display text-2xl italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>2020</div>
                <div className="text-[10px] uppercase tracking-widest mt-1">COVID — 대회 취소</div>
              </div>
            </div>
          </section>

          {/* 🔍 패턴 인사이트 */}
          <section className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-5">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
              Champion Patterns
            </div>
            <h3 className="font-display italic text-2xl text-tango-paper mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              22년 우승자 데이터가 <em className="text-tango-brass">말해주는 것</em>
            </h3>
            <ul className="space-y-2">
              {PATTERN_INSIGHTS.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-tango-paper/85 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  <span className="text-tango-brass flex-shrink-0">→</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 🎓 심사위원이었던 전 우승자 */}
          {(() => {
            const judgesWhoWon = pistaChampions.filter(c => championBadge(c.leader, c.follower));
            if (judgesWhoWon.length === 0) return null;
            return (
              <section className="bg-gradient-to-br from-tango-brass/10 via-tango-shadow to-tango-ink border border-tango-brass/30 rounded-sm p-6">
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                  Judge ≡ Former Champion
                </div>
                <h3 className="font-display italic text-2xl text-tango-paper mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  지금 심사하는 사람이 <em className="text-tango-brass">과거에 우승</em>했다
                </h3>
                <p className="text-sm text-tango-paper/80 font-serif italic mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  이들은 자신이 우승했던 기준으로 심사합니다 — 그들의 우승 연도 패턴을 분석해두면 현 대회 유리
                </p>
                <div className="space-y-2">
                  {judgesWhoWon.map(c => (
                    <div key={`${c.year}-judge`} className="flex items-baseline gap-4 text-sm border-b border-tango-brass/10 pb-2">
                      <span className="text-tango-brass font-bold w-12">{c.year}</span>
                      <span className="text-tango-paper font-serif italic flex-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {c.leader} & {c.follower}
                      </span>
                      <span className="text-[10px] text-tango-cream/50">{c.country}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* 다중 우승자 */}
          {multipleWins.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                Multi-Champion Dancers
              </div>
              <h3 className="font-display italic text-2xl text-tango-paper mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                여러 번 우승한 <em className="text-tango-brass">커플들</em>
              </h3>
              <div className="space-y-2">
                {multipleWins.map(p => (
                  <div key={p.name} className="flex items-baseline gap-3 text-sm bg-tango-shadow/40 border border-tango-brass/15 rounded-sm px-4 py-2">
                    <span className="font-serif italic text-tango-paper flex-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                      {p.name}
                    </span>
                    <span className="text-[10px] text-tango-cream/60">
                      {p.years.sort((a, b) => a - b).join(' · ')}
                    </span>
                    <span className="text-tango-brass font-bold">{p.years.length}회</span>
                    <span className="text-[10px] text-tango-cream/50">
                      ({[...new Set(p.categories)].join(', ')})
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 결승 악단 TOP 8 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Finals · Most Used Orchestras
            </div>
            <h2 className="font-display text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              결승에서 울려 퍼진 <em className="text-tango-brass">악단 TOP 8</em>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-tango-brass/15 rounded-sm overflow-hidden">
              {analysis.topOrchs.map(([o, count], i) => {
                const pos = analysis.positionFreq[o];
                return (
                  <div key={o} className="bg-tango-ink p-5 md:p-6">
                    <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mb-2 font-sans">
                      No. {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-display italic text-2xl text-tango-paper leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {o}
                    </h3>
                    <div className="font-display text-3xl text-tango-brass font-bold mt-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {count}<span className="text-sm font-sans ml-1 text-tango-cream/60 font-normal">회</span>
                    </div>
                    {pos && (
                      <div className="flex gap-2 text-[10px] mt-3 font-sans">
                        <span className="text-tango-brass/70">1st {pos.pos1}</span>
                        <span className="text-tango-brass/70">2nd {pos.pos2}</span>
                        <span className="text-tango-brass/70">3rd {pos.pos3}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <TrendInsight
              context={`Mundial 결승 ${analysis.totalFinalRondas}개 라운드에서 TOP 악단: ${analysis.topOrchs.map(([o, c]) => `${o}(${c}회)`).join(', ')}. 포지션 분포: ${Object.entries(analysis.positionFreq).slice(0, 5).map(([o, p]) => `${o}: 1st=${p.pos1}/2nd=${p.pos2}/3rd=${p.pos3}`).join('; ')}.`}
              cacheKey="champions-orchestras"
              title="우승 전략 인사이트"
            />
          </section>

          {/* 결승 곡 TOP 10 */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Finals · Most Used Songs
            </div>
            <h2 className="font-display text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              결승에서 <em className="text-tango-brass">여러 번 선택된 곡들</em>
            </h2>
            <div className="space-y-0">
              {analysis.topSongs.map((s, i) => (
                <Link
                  key={s.song_id}
                  to={`/song/${s.song_id}`}
                  className="group grid grid-cols-[50px_1fr_auto] items-baseline gap-4 py-4 border-b border-tango-brass/15 hover:bg-tango-brass/5 px-3 -mx-3 transition-colors"
                >
                  <span className="font-display text-2xl md:text-3xl text-tango-brass/50 italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display italic text-xl text-tango-paper group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {s.song?.title || s.song_id}
                    </div>
                    <div className="text-[11px] tracking-widest uppercase text-tango-cream/50 font-sans mt-0.5 truncate">
                      {s.song?.orchestra || '미상'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {s.count}
                    </div>
                    <div className="text-[9px] tracking-widest uppercase text-tango-cream/40">결승</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 결승 실제 대회 영상 */}
          {analysis.perfVideos.length > 0 && (
            <section>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                Final Performances · Real Footage
              </div>
              <h2 className="font-display text-3xl text-tango-paper italic mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                결승 <em className="text-tango-brass">실제 영상</em>
              </h2>
              <p className="text-xs text-tango-cream/60 font-serif italic mb-4" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                우승자와 결승 진출자들의 실제 퍼포먼스만 모았습니다 (음악 전용 영상 제외)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.perfVideos.map((v: any) => (
                  <a
                    key={v.video_id}
                    href={`https://www.youtube.com/watch?v=${v.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-video bg-tango-shadow/60 border border-tango-brass/20 hover:border-tango-brass rounded-sm overflow-hidden transition-all"
                  >
                    <img
                      src={`https://i.ytimg.com/vi/${v.video_id}/mqdefault.jpg`}
                      alt={v.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex flex-col justify-end">
                      <div className="text-[9px] tracking-widest uppercase text-tango-brass font-sans">
                        {v.year} · Final R{v.ronda}
                      </div>
                      <div className="text-xs text-tango-paper font-serif italic line-clamp-2" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {v.title}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 text-tango-paper/80 group-hover:text-tango-brass text-xl">▶</div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <OrnamentDivider className="pt-8" />
        </div>
      </div>

      {/* Champion 프로필 모달 */}
      {selectedProfile && (
        <div
          className="fixed inset-0 z-50 bg-tango-ink/90 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedProfile(null)}
        >
          <div
            className="w-full max-w-2xl bg-gradient-to-br from-tango-brass/10 via-tango-shadow to-tango-ink border border-tango-brass/40 rounded-sm p-6 md:p-8 my-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-1">
                  Mundial {selectedProfile.year} · {selectedProfile.category.toUpperCase()} Champion
                </div>
                <h2 className="font-display italic text-3xl text-tango-paper" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {selectedProfile.couple}
                </h2>
                <p className="text-sm text-tango-cream/60 mt-1 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  {selectedProfile.origin}
                </p>
              </div>
              <button onClick={() => setSelectedProfile(null)} className="text-tango-cream/60 hover:text-tango-brass text-2xl leading-none">×</button>
            </div>

            {/* Style Summary */}
            <div className="mb-5">
              <div className="text-[10px] tracking-widest uppercase text-tango-brass font-sans mb-2">Style Signature</div>
              <p className="font-serif italic text-lg text-tango-paper leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {selectedProfile.style_summary}
              </p>
            </div>

            {/* Characteristics */}
            <div className="mb-5">
              <div className="text-[10px] tracking-widest uppercase text-tango-brass font-sans mb-2">Dance Characteristics</div>
              <ul className="space-y-1.5">
                {selectedProfile.characteristics.map((c, i) => (
                  <li key={i} className="text-sm text-tango-paper/85 flex gap-2 font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                    <span className="text-tango-brass flex-shrink-0">·</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Takeaway */}
            <div className="mb-5 bg-tango-brass/10 border border-tango-brass/30 rounded-sm p-4">
              <div className="text-[10px] tracking-widest uppercase text-tango-brass font-sans mb-2">🎯 Strategic Takeaway</div>
              <p className="text-sm text-tango-paper leading-relaxed font-serif italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {selectedProfile.strategic_takeaway}
              </p>
            </div>

            {/* Key Quote */}
            {selectedProfile.key_quote && (
              <div className="mb-4 pl-4 border-l-2 border-tango-brass/50">
                <p className="text-sm italic text-tango-paper font-serif" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  "{selectedProfile.key_quote}"
                </p>
              </div>
            )}

            {/* Optional fields */}
            <div className="space-y-1.5 text-xs text-tango-cream/70 font-sans">
              {selectedProfile.music_preference && (
                <div>🎵 <strong className="text-tango-brass">선호 악단:</strong> {selectedProfile.music_preference}</div>
              )}
              {selectedProfile.teaching_activity && (
                <div>🎓 <strong className="text-tango-brass">활동:</strong> {selectedProfile.teaching_activity}</div>
              )}
              {selectedProfile.notable_history && (
                <div>📌 <strong className="text-tango-brass">주목할 이력:</strong> {selectedProfile.notable_history}</div>
              )}
              {selectedProfile.links && selectedProfile.links.length > 0 && (
                <div className="pt-2">
                  {selectedProfile.links.map((link, i) => (
                    <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="text-tango-brass hover:underline mr-3">
                      🔗 참고 링크
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 pt-4 border-t border-tango-brass/15 text-[10px] text-tango-cream/40 font-sans">
              TangoLab 큐레이션 — 추가 정보는 Wikipedia, 공식 인터뷰 기반
            </div>
          </div>
        </div>
      )}
    </>
  );
}
