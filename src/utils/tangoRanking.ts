import type { Song, Appearance, SongRanking } from '../types/tango';

const STAGE_WEIGHTS: Record<string, number> = {
  qualifying: 1,
  semifinal: 2,
  final: 3,
};

export function computeRankings(songs: Song[], appearances: Appearance[]): SongRanking[] {
  const songMap = new Map<string, Song>();
  for (const s of songs) songMap.set(s.song_id, s);

  const stats = new Map<string, {
    total: number;
    weighted: number;
    final: number;
    semifinal: number;
    qualifying: number;
    years: Set<number>;
    comps: Set<string>;
  }>();

  for (const app of appearances) {
    if (!stats.has(app.song_id)) {
      stats.set(app.song_id, {
        total: 0, weighted: 0, final: 0, semifinal: 0, qualifying: 0,
        years: new Set(), comps: new Set(),
      });
    }
    const s = stats.get(app.song_id)!;
    s.total++;
    s.weighted += STAGE_WEIGHTS[app.stage] ?? 1;
    if (app.stage === 'final') s.final++;
    if (app.stage === 'semifinal') s.semifinal++;
    if (app.stage === 'qualifying') s.qualifying++;
    s.years.add(app.year);
    s.comps.add(app.competition_id);
  }

  const rankings: SongRanking[] = [];
  for (const [sid, s] of stats) {
    const song = songMap.get(sid);
    rankings.push({
      song_id: sid,
      title: song?.title ?? sid,
      orchestra: song?.orchestra ?? null,
      total_appearances: s.total,
      weighted_score: s.weighted,
      final_count: s.final,
      semifinal_count: s.semifinal,
      qualifying_count: s.qualifying,
      years: Array.from(s.years).sort(),
      competitions: Array.from(s.comps),
    });
  }

  rankings.sort((a, b) => b.weighted_score - a.weighted_score);
  return rankings;
}

export function getAppearancesForSong(songId: string, appearances: Appearance[]): Appearance[] {
  return appearances
    .filter(a => a.song_id === songId)
    .sort((a, b) => b.year - a.year || a.stage.localeCompare(b.stage));
}

export function getYearlyTrend(songId: string, appearances: Appearance[]): { year: number; count: number }[] {
  const yearCount = new Map<number, number>();
  for (const a of appearances) {
    if (a.song_id === songId) {
      yearCount.set(a.year, (yearCount.get(a.year) ?? 0) + 1);
    }
  }
  return Array.from(yearCount.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);
}
