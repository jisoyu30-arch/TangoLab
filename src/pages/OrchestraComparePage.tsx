// 악단 비교 — 두 악단 나란히 비교
import { useState, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { OrchestraProfile, hasOrchestraProfile } from '../components/OrchestraProfile';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import orchestrasData from '../data/orchestras.json';
import type { Song, Appearance, Orchestra } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const orchestras = orchestrasData as Orchestra[];
const songMap = new Map(songs.map(s => [s.song_id, s]));

interface OrchStats {
  orchestra: Orchestra;
  totalApp: number;
  finalCount: number;
  semifinalCount: number;
  topSongs: Array<{ title: string; count: number }>;
  yearSpread: number[];
}

function computeStats(orch: Orchestra): OrchStats {
  const orchSongs = songs.filter(s => s.orchestra_id === orch.orchestra_id);
  const songSet = new Set(orchSongs.map(s => s.song_id));

  const songCount: Record<string, number> = {};
  let total = 0, final = 0, semi = 0;
  const years = new Set<number>();

  for (const a of appearances) {
    if (!songSet.has(a.song_id)) continue;
    total++;
    if (a.stage === 'final') final++;
    if (a.stage === 'semifinal') semi++;
    years.add(a.year);
    const song = songMap.get(a.song_id);
    if (song) {
      songCount[song.title] = (songCount[song.title] || 0) + 1;
    }
  }

  const topSongs = Object.entries(songCount)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    orchestra: orch,
    totalApp: total,
    finalCount: final,
    semifinalCount: semi,
    topSongs,
    yearSpread: Array.from(years).sort(),
  };
}

export function OrchestraComparePage() {
  const [leftId, setLeftId] = useState(orchestras[0]?.orchestra_id || '');
  const [rightId, setRightId] = useState(orchestras[1]?.orchestra_id || '');

  const leftStats = useMemo(() => {
    const o = orchestras.find(x => x.orchestra_id === leftId);
    return o ? computeStats(o) : null;
  }, [leftId]);
  const rightStats = useMemo(() => {
    const o = orchestras.find(x => x.orchestra_id === rightId);
    return o ? computeStats(o) : null;
  }, [rightId]);

  return (
    <>
      <PageHeader title="악단 비교" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 space-y-10">
          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Duel · Side by Side
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              악단 <em className="text-tango-brass">맞대결</em>
            </h1>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 선택 UI */}
          <div className="grid grid-cols-2 gap-4">
            <select
              value={leftId}
              onChange={(e) => setLeftId(e.target.value)}
              className="bg-tango-shadow border border-tango-brass/30 rounded-sm px-4 py-3 text-tango-paper font-serif italic focus:outline-none focus:border-tango-brass"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              {orchestras.map(o => (
                <option key={o.orchestra_id} value={o.orchestra_id}>
                  {shortOrchestraName(o.orchestra_name)}
                </option>
              ))}
            </select>
            <select
              value={rightId}
              onChange={(e) => setRightId(e.target.value)}
              className="bg-tango-shadow border border-tango-brass/30 rounded-sm px-4 py-3 text-tango-paper font-serif italic focus:outline-none focus:border-tango-brass"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            >
              {orchestras.map(o => (
                <option key={o.orchestra_id} value={o.orchestra_id}>
                  {shortOrchestraName(o.orchestra_name)}
                </option>
              ))}
            </select>
          </div>

          {leftStats && rightStats && (
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              {[leftStats, rightStats].map((s, col) => (
                <div key={col} className="space-y-6">
                  {/* 악단 이름 */}
                  <div className="text-center border-b border-tango-brass/15 pb-4">
                    <h2 className="font-display text-3xl md:text-4xl text-tango-paper italic leading-tight" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {shortOrchestraName(s.orchestra.orchestra_name)}
                    </h2>
                    <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-2 font-sans">
                      {s.yearSpread[0]}–{s.yearSpread[s.yearSpread.length - 1]}
                    </div>
                  </div>

                  {/* 통계 */}
                  <div className="space-y-3">
                    <CompareStat label="총 출현" a={s.totalApp} b={col === 0 ? rightStats.totalApp : leftStats.totalApp} />
                    <CompareStat label="결승" a={s.finalCount} b={col === 0 ? rightStats.finalCount : leftStats.finalCount} />
                    <CompareStat label="준결승" a={s.semifinalCount} b={col === 0 ? rightStats.semifinalCount : leftStats.semifinalCount} />
                  </div>

                  {/* 대표 곡 */}
                  <div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-tango-brass mb-3 font-sans">
                      대표 곡 TOP 5
                    </div>
                    <div className="space-y-2">
                      {s.topSongs.map((t, i) => (
                        <div key={i} className="flex items-baseline gap-3 border-b border-tango-brass/10 pb-1.5">
                          <span className="text-tango-brass/50 text-sm font-sans w-5 flex-shrink-0">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="flex-1 min-w-0 truncate font-serif italic text-tango-paper text-sm" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                            {t.title}
                          </span>
                          <span className="text-tango-brass text-xs font-bold flex-shrink-0">{t.count}회</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 스타일 태그 */}
                  {s.orchestra.style_tags.length > 0 && (
                    <div>
                      <div className="text-[10px] tracking-[0.25em] uppercase text-tango-brass mb-3 font-sans">스타일</div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.orchestra.style_tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 border border-tango-brass/30 text-tango-brass rounded-sm uppercase tracking-wider font-sans">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 심층 프로파일 — 두 악단 모두 프로파일 있을 때만 노출 */}
          {leftStats && rightStats && hasOrchestraProfile(leftStats.orchestra.orchestra_id) && hasOrchestraProfile(rightStats.orchestra.orchestra_id) && (
            <div className="space-y-8">
              <OrnamentDivider />
              <div className="text-center">
                <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                  Deep Profile · 심층 프로파일
                </div>
                <h2 className="font-display text-2xl md:text-3xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  연혁 · 보컬 · 에피소드
                </h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-tango-shadow/30 border border-tango-brass/15 rounded-sm p-5">
                  <h3 className="font-display text-2xl text-tango-paper italic mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {leftStats.orchestra.orchestra_name}
                  </h3>
                  <OrchestraProfile orchestraId={leftStats.orchestra.orchestra_id} />
                </div>
                <div className="bg-tango-shadow/30 border border-tango-brass/15 rounded-sm p-5">
                  <h3 className="font-display text-2xl text-tango-paper italic mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {rightStats.orchestra.orchestra_name}
                  </h3>
                  <OrchestraProfile orchestraId={rightStats.orchestra.orchestra_id} />
                </div>
              </div>
            </div>
          )}

          {/* 한쪽만 프로파일 있을 때 */}
          {leftStats && rightStats && (
            (hasOrchestraProfile(leftStats.orchestra.orchestra_id) !== hasOrchestraProfile(rightStats.orchestra.orchestra_id)) && (
              <div className="bg-tango-brass/5 border border-tango-brass/20 rounded-sm p-4 text-center text-xs text-tango-cream/60 font-serif italic">
                심층 프로파일은 양쪽 악단 모두 데이터가 있어야 노출됩니다. 현재 D'Arienzo·Di Sarli·Pugliese·Troilo·Caló·Tanturi 6개 악단 정리됨.
              </div>
            )
          )}

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}

function CompareStat({ label, a, b }: { label: string; a: number; b: number }) {
  const winner = a > b ? 'a' : a < b ? 'b' : 'tie';
  return (
    <div className="flex items-center justify-between py-2 border-b border-tango-brass/10">
      <span className="text-[10px] tracking-widest uppercase text-tango-cream/60 font-sans">{label}</span>
      <span className={`font-display text-2xl font-bold ${
        winner === 'a' ? 'text-tango-brass' : winner === 'tie' ? 'text-tango-paper' : 'text-tango-cream/50'
      }`} style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {a}
      </span>
    </div>
  );
}
