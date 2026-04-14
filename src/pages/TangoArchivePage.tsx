import { useMemo } from 'react';
import { SongFilters } from '../components/tango/SongFilters';
import { SongList } from '../components/tango/SongList';
import { SongRankingChart } from '../components/tango/SongRankingChart';
import { useSongFilters } from '../hooks/useSongFilters';
import { computeRankings } from '../utils/tangoRanking';

import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import orchestrasData from '../data/orchestras.json';
import competitionsData from '../data/competitions.json';

import type { Song, Appearance, Orchestra, Competition } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const orchestras = orchestrasData as Orchestra[];
const competitions = competitionsData as Competition[];

export function TangoArchivePage() {
  const rankings = useMemo(() => computeRankings(songs, appearances), []);
  const { filters, setFilters, filtered, resetFilters } = useSongFilters(rankings, songs);

  const years = useMemo(() => {
    const s = new Set<number>();
    for (const a of appearances) s.add(a.year);
    return Array.from(s).sort((a, b) => b - a);
  }, []);

  const topOrchestra = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of appearances) {
      const song = songs.find(s => s.song_id === a.song_id);
      const orch = song?.orchestra ?? 'Unknown';
      counts.set(orch, (counts.get(orch) ?? 0) + 1);
    }
    let max = '', maxCount = 0;
    for (const [k, v] of counts) {
      if (v > maxCount) { max = k; maxCount = v; }
    }
    return max;
  }, []);

  return (
    <>
      <header className="h-14 border-b border-secretary-gold/20 flex items-center px-5 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-300">탱고 대회 음악 아카이브</h2>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-5 space-y-6">
          {/* 소개 */}
          <div>
            <h1 className="text-2xl font-bold text-secretary-gold mb-1">석정소유의 탱고랩</h1>
            <p className="text-gray-400 text-sm">
              Mundial 2012~2025 예선·준결승·결승 곡 분석. 대회에서 이기는 음악을 연구하자.
            </p>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="총 곡" value={`${songs.length}곡`} />
            <StatCard label="출현 기록" value={`${appearances.length}건`} />
            <StatCard label="TOP 오케스트라" value={topOrchestra.split(' ')[0]} />
            <StatCard label="커버 연도" value={`${Math.min(...years)}~${Math.max(...years)}`} />
          </div>

          {/* 필터 */}
          <SongFilters
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            orchestras={orchestras}
            competitions={competitions}
            resultCount={filtered.length}
            years={years}
          />

          {/* 차트 */}
          <SongRankingChart rankings={filtered} />

          {/* 곡 목록 */}
          <div className="bg-white/5 rounded-xl border border-secretary-gold/10 p-4">
            <SongList rankings={filtered} />
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-secretary-gold/10">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-secretary-gold">{value}</div>
    </div>
  );
}
