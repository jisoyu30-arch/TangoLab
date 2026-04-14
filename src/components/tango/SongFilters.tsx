import type { SongFilters as Filters } from '../../hooks/useSongFilters';
import type { Orchestra, Competition } from '../../types/tango';
import { STAGE_LABELS } from '../../utils/tangoHelpers';

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  resetFilters: () => void;
  orchestras: Orchestra[];
  competitions: Competition[];
  resultCount: number;
  years: number[];
}

export function SongFilters({ filters, setFilters, resetFilters, orchestras, competitions, resultCount, years }: Props) {
  const set = (key: keyof Filters, value: string) =>
    setFilters({ ...filters, [key]: value });

  const hasFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          placeholder="곡명 또는 오케스트라 검색..."
          className="flex-1 min-w-[200px] bg-white/5 border border-secretary-gold/20 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-secretary-gold/50"
        />

        <select
          value={filters.orchestra}
          onChange={e => set('orchestra', e.target.value)}
          className="bg-white/5 border border-secretary-gold/20 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-secretary-gold/50"
        >
          <option value="">전체 오케스트라</option>
          {orchestras.map(o => (
            <option key={o.orchestra_id} value={o.orchestra_id}>{o.alt_names[0] || o.orchestra_name}</option>
          ))}
        </select>

        <select
          value={filters.stage}
          onChange={e => set('stage', e.target.value)}
          className="bg-white/5 border border-secretary-gold/20 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-secretary-gold/50"
        >
          <option value="">전체 스테이지</option>
          {Object.entries(STAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filters.year}
          onChange={e => set('year', e.target.value)}
          className="bg-white/5 border border-secretary-gold/20 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-secretary-gold/50"
        >
          <option value="">전체 연도</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          value={filters.competition}
          onChange={e => set('competition', e.target.value)}
          className="bg-white/5 border border-secretary-gold/20 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-secretary-gold/50"
        >
          <option value="">전체 대회</option>
          {competitions.map(c => (
            <option key={c.competition_id} value={c.competition_id}>{c.alt_names[0] || c.competition_name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{resultCount}곡 표시</span>
        {hasFilters && (
          <button onClick={resetFilters} className="text-secretary-gold hover:underline">
            필터 초기화
          </button>
        )}
      </div>
    </div>
  );
}
