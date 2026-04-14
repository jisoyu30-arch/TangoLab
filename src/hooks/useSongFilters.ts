import { useState, useMemo } from 'react';
import type { Song, SongRanking } from '../types/tango';

export interface SongFilters {
  search: string;
  orchestra: string;
  year: string;
  stage: string;
  competition: string;
}

const EMPTY: SongFilters = { search: '', orchestra: '', year: '', stage: '', competition: '' };

export function useSongFilters(rankings: SongRanking[], songs: Song[]) {
  const [filters, setFilters] = useState<SongFilters>(EMPTY);

  const songMap = useMemo(() => {
    const m = new Map<string, Song>();
    for (const s of songs) m.set(s.song_id, s);
    return m;
  }, [songs]);

  const filtered = useMemo(() => {
    let result = rankings;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.orchestra ?? '').toLowerCase().includes(q)
      );
    }

    if (filters.orchestra) {
      result = result.filter(r => {
        const song = songMap.get(r.song_id);
        return song?.orchestra_id === filters.orchestra ||
          (r.orchestra ?? '').toLowerCase().includes(filters.orchestra.toLowerCase());
      });
    }

    if (filters.year) {
      const y = Number(filters.year);
      result = result.filter(r => r.years.includes(y));
    }

    if (filters.stage) {
      result = result.filter(r => {
        if (filters.stage === 'final') return r.final_count > 0;
        if (filters.stage === 'semifinal') return r.semifinal_count > 0;
        if (filters.stage === 'qualifying') return r.qualifying_count > 0;
        return true;
      });
    }

    if (filters.competition) {
      result = result.filter(r => r.competitions.includes(filters.competition));
    }

    return result;
  }, [rankings, filters, songMap]);

  const resetFilters = () => setFilters(EMPTY);

  return { filters, setFilters, filtered, resetFilters };
}
