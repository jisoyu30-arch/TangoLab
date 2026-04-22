// 보컬리스트 분석 — 각 보컬의 대회 곡 모음
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const songMap = new Map(songs.map(s => [s.song_id, s]));

interface VocalistStat {
  name: string;
  songs: Song[];
  totalApp: number;
  finalCount: number;
  orchestras: Set<string>;
  years: Set<number>;
}

export function VocalistsPage() {
  const [query, setQuery] = useState('');

  const vocalists = useMemo(() => {
    const map = new Map<string, VocalistStat>();

    for (const song of songs) {
      if (!song.vocalist) continue;
      const name = song.vocalist.trim();
      if (!name) continue;
      if (!map.has(name)) {
        map.set(name, {
          name,
          songs: [],
          totalApp: 0,
          finalCount: 0,
          orchestras: new Set(),
          years: new Set(),
        });
      }
      const v = map.get(name)!;
      v.songs.push(song);
      if (song.orchestra) v.orchestras.add(song.orchestra.split(' ')[0]);
    }

    // Appearance 카운트
    for (const a of appearances) {
      const song = songMap.get(a.song_id);
      if (!song?.vocalist) continue;
      const v = map.get(song.vocalist.trim());
      if (!v) continue;
      v.totalApp++;
      v.years.add(a.year);
      if (a.stage === 'final') v.finalCount++;
    }

    return Array.from(map.values())
      .filter(v => v.totalApp > 0)
      .sort((a, b) => b.totalApp - a.totalApp);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return vocalists;
    const q = query.toLowerCase();
    return vocalists.filter(v => v.name.toLowerCase().includes(q));
  }, [vocalists, query]);

  return (
    <>
      <PageHeader title="보컬리스트" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-4xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Voices · Vocalists
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              탱고의 <em className="text-tango-brass">목소리</em>
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic">
              골든 에이지 보컬리스트 {vocalists.length}인
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          {/* 검색 */}
          <div className="relative max-w-lg mx-auto">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-tango-brass">◈</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="보컬리스트 검색…"
              className="w-full bg-transparent border-0 border-b-2 border-tango-brass/30 focus:border-tango-brass pb-2 pt-1 pl-8 font-serif text-lg text-tango-paper placeholder-tango-cream/30 focus:outline-none"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            />
          </div>

          {/* 목록 */}
          <div className="space-y-0">
            {filtered.slice(0, 50).map((v, i) => (
              <div key={v.name} className="grid grid-cols-[60px_1fr_auto] items-baseline gap-4 py-5 border-b border-tango-brass/15 hover:bg-tango-brass/5 px-3 -mx-3 transition-colors">
                <span className="font-display text-3xl text-tango-brass/50 italic leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl md:text-2xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {v.name}
                  </h3>
                  <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans mt-1">
                    악단 {v.orchestras.size}개 · 곡 {v.songs.length}개
                    {v.years.size > 0 && ` · ${Math.min(...v.years)}–${Math.max(...v.years)}`}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.songs.slice(0, 3).map(s => (
                      <Link
                        key={s.song_id}
                        to={`/song/${s.song_id}`}
                        className="text-[11px] text-tango-cream/60 hover:text-tango-brass font-serif italic transition-colors"
                        style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
                      >
                        {s.title}
                      </Link>
                    ))}
                    {v.songs.length > 3 && (
                      <span className="text-[11px] text-tango-cream/40 font-sans">+{v.songs.length - 3}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display text-xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    {v.totalApp}
                  </div>
                  <div className="text-[9px] tracking-widest uppercase text-tango-cream/40">출현</div>
                  {v.finalCount > 0 && (
                    <div className="text-[10px] text-tango-rose mt-1">결{v.finalCount}</div>
                  )}
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
