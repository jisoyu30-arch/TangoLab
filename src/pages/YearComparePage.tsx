// 연도 vs 연도 비교 — Mundial 두 해 나란히
import { useState, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import roundsData from '../data/competition_rounds.json';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const rounds = (roundsData as any).rounds;
const songMap = new Map(songs.map(s => [s.song_id, s]));

function computeYearStats(year: number) {
  const apps = appearances.filter(a => a.year === year && a.competition_id === 'COMP-001');
  const yearRounds = rounds.filter((r: any) => r.year === year && r.competition === 'Mundial');

  const orchCount: Record<string, number> = {};
  const songCount: Record<string, number> = {};
  let finalN = 0, semiN = 0, qualifyingN = 0;

  for (const a of apps) {
    if (a.stage === 'final') finalN++;
    if (a.stage === 'semifinal') semiN++;
    if (a.stage === 'qualifying') qualifyingN++;
    const song = songMap.get(a.song_id);
    if (song?.orchestra) {
      const o = shortOrchestraName(song.orchestra);
      orchCount[o] = (orchCount[o] || 0) + 1;
    }
    songCount[a.song_id] = (songCount[a.song_id] || 0) + 1;
  }

  const topOrchs = Object.entries(orchCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topSongs = Object.entries(songCount)
    .map(([id, count]) => ({ id, count, song: songMap.get(id) }))
    .filter(x => x.song)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    year,
    apps: apps.length,
    rounds: yearRounds.length,
    finalN, semiN, qualifyingN,
    topOrchs,
    topSongs,
  };
}

export function YearComparePage() {
  const years = useMemo(() => {
    const set = new Set(appearances.filter(a => a.competition_id === 'COMP-001').map(a => a.year));
    return Array.from(set).sort();
  }, []);

  const [leftYear, setLeftYear] = useState(2019);
  const [rightYear, setRightYear] = useState(2024);

  const left = useMemo(() => computeYearStats(leftYear), [leftYear]);
  const right = useMemo(() => computeYearStats(rightYear), [rightYear]);

  return (
    <>
      <PageHeader title="연도 비교" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-10">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Cross-Year · Mundial
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              <em className="text-tango-brass">시간</em>의 두 순간
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              두 해의 Mundial을 나란히 읽다
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <select
              value={leftYear}
              onChange={(e) => setLeftYear(Number(e.target.value))}
              className="bg-tango-shadow border border-tango-brass/30 rounded-sm px-4 py-3 text-tango-paper font-serif italic focus:outline-none focus:border-tango-brass text-xl text-center"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={rightYear}
              onChange={(e) => setRightYear(Number(e.target.value))}
              className="bg-tango-shadow border border-tango-brass/30 rounded-sm px-4 py-3 text-tango-paper font-serif italic focus:outline-none focus:border-tango-brass text-xl text-center"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* 비교 */}
          <div className="grid grid-cols-2 gap-4 md:gap-8">
            {[left, right].map((y, col) => (
              <div key={col} className="space-y-6">
                <div className="text-center border-b border-tango-brass/15 pb-6">
                  <div className="font-display text-5xl md:text-7xl text-tango-brass font-bold italic leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {y.year}
                  </div>
                  <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-2 font-sans">
                    Mundial de Tango
                  </div>
                </div>

                {/* 스테이지 통계 */}
                <div className="space-y-2">
                  <Row label="총 출현" value={y.apps} />
                  <Row label="라운드" value={y.rounds} />
                  <Row label="결승" value={y.finalN} color="rose" />
                  <Row label="준결승" value={y.semiN} />
                  <Row label="예선" value={y.qualifyingN} />
                </div>

                {/* TOP 악단 */}
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-tango-brass mb-3 font-sans">
                    TOP 5 악단
                  </div>
                  <div className="space-y-2">
                    {y.topOrchs.map(([o, c], i) => (
                      <div key={o} className="flex items-baseline gap-3 border-b border-tango-brass/10 pb-1.5">
                        <span className="text-tango-brass/50 text-sm font-sans w-5 flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1 min-w-0 truncate font-serif italic text-tango-paper text-base" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {o}
                        </span>
                        <span className="text-tango-brass text-xs font-bold flex-shrink-0">{c}회</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOP 곡 */}
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-tango-brass mb-3 font-sans">
                    TOP 5 곡
                  </div>
                  <div className="space-y-2">
                    {y.topSongs.map(({ id, count, song }, i) => (
                      <div key={id} className="flex items-baseline gap-3 border-b border-tango-brass/10 pb-1.5">
                        <span className="text-tango-brass/50 text-sm font-sans w-5 flex-shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="flex-1 min-w-0 truncate font-serif italic text-tango-paper text-sm" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {song?.title}
                        </span>
                        <span className="text-tango-brass text-xs font-bold flex-shrink-0">{count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}

function Row({ label, value, color = 'default' }: { label: string; value: number; color?: 'default' | 'rose' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-tango-brass/10">
      <span className="text-[10px] tracking-widest uppercase text-tango-cream/60 font-sans">{label}</span>
      <span
        className={`font-display text-xl md:text-2xl font-bold ${color === 'rose' ? 'text-tango-rose' : 'text-tango-brass'}`}
        style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
      >
        {value}
      </span>
    </div>
  );
}
