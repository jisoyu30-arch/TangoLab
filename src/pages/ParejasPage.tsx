// Mundial 2026 등번호(파레하) 조회 — 영상 속 등번호로 커플·성적·영상을 찾는다
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import parejasData from '../data/mundial_2026_parejas.json';

interface StageRecord {
  stage: string;
  group: string | null;
  ronda: number | null;
  rank: number;
  of: number;
  promedio: number;
  advanced: boolean | null;
  videos: { video_id: string; title: string | null; channel: string | null }[];
}
interface Pareja {
  pareja: number;
  leader: string;
  follower: string;
  furthest_stage: string;
  stages: StageRecord[];
  has_video: boolean;
  name_variants?: string[];
  final_rank?: number;
}

const d = parejasData as unknown as {
  year: number; category: string; total: number; note: string; parejas: Pareja[];
};

const STAGE_KO: Record<string, string> = {
  clasificatoria: '예선', cuartos: '8강', semifinal: '준결승', final: '결승',
};
/** 도달 단계는 순서가 있는 값 — 단일 색조(브라스)의 밝기 단계로 표현하고 글자도 함께 적는다 */
const DEPTH: Record<string, string> = {
  clasificatoria: 'bg-tango-brass/10 text-tango-cream/60 border border-white/10',
  cuartos: 'bg-tango-brass/25 text-tango-cream/80 border border-tango-brass/25',
  semifinal: 'bg-tango-brass/45 text-tango-paper border border-tango-brass/40',
  final: 'bg-tango-brass text-tango-ink font-semibold border border-tango-brass',
};
const MEDAL = ['🥇', '🥈', '🥉'];

type Filter = 'all' | 'podium' | 'semifinal' | 'cuartos' | 'video';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'podium', label: '시상' },
  { key: 'semifinal', label: '준결승 진출' },
  { key: 'cuartos', label: '8강 진출' },
  { key: 'video', label: '영상 있음' },
];

/** 악센트를 무시하고 비교 — "Valentín" 을 "valentin" 으로 쳐도 찾히게 */
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function ParejasPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return d.parejas.filter(p => {
      if (filter === 'podium' && !p.final_rank) return false;
      if (filter === 'semifinal' && !p.stages.some(s => s.stage === 'semifinal')) return false;
      if (filter === 'cuartos' && !p.stages.some(s => s.stage === 'cuartos')) return false;
      if (filter === 'video' && !p.has_video) return false;
      if (!q) return true;
      if (String(p.pareja).startsWith(q)) return true;
      const hay = norm(`${p.leader} ${p.follower} ${(p.name_variants ?? []).join(' ')}`);
      return hay.includes(q);
    });
  }, [query, filter]);

  // 검색어 없이 '전체'면 목록이 576개라 앞부분만 — 검색을 유도한다
  const capped = query.trim() === '' && filter === 'all' ? filtered.slice(0, 40) : filtered;

  return (
    <>
      <PageHeader title="등번호 조회" />
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
        <section className="bg-white/5 border border-tango-brass/20 rounded-xl p-4">
          <h1 className="text-base font-bold text-white">
            Mundial de Tango {d.year} · Tango Pista 등번호
          </h1>
          <p className="text-xs text-tango-cream/50 mt-0.5">
            {d.total}개 등번호 · 영상에서 등번호를 보고 커플·성적·해당 론다 영상을 찾을 수 있다
          </p>

          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="등번호 또는 이름 (예: 460, gauto, 사람 이름)"
            className="mt-3 w-full px-3 py-2 rounded-lg bg-tango-ink/60 border border-white/10 text-sm text-tango-cream placeholder:text-tango-cream/30 focus:outline-none focus:border-tango-brass/50"
          />

          <div className="flex gap-1.5 flex-wrap mt-2">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  filter === f.key
                    ? 'bg-tango-brass/25 text-tango-brass'
                    : 'bg-white/5 text-tango-cream/50 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-tango-cream/40 self-center">
              {filtered.length}개
              {capped.length < filtered.length && ` (앞 ${capped.length}개 표시 — 검색해 보세요)`}
            </span>
          </div>
        </section>

        <div className="space-y-1.5">
          {capped.map(p => {
            const open = expanded === p.pareja;
            const last = p.stages[p.stages.length - 1];
            return (
              <div key={p.pareja} className="rounded-lg bg-white/5 overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : p.pareja)}
                  className="w-full text-left px-3 py-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 hover:bg-white/5"
                >
                  <span className="tabular-nums text-tango-brass font-semibold w-14 shrink-0">
                    #{p.pareja}
                  </span>
                  <span className="text-sm text-white min-w-0">
                    {p.leader} <span className="text-tango-cream/50">&amp;</span> {p.follower}
                  </span>
                  {p.final_rank && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-tango-brass text-tango-ink font-semibold">
                      {MEDAL[p.final_rank - 1]} 결승 {p.final_rank}위
                    </span>
                  )}
                  <span className={`text-[11px] px-1.5 py-0.5 rounded ${DEPTH[p.furthest_stage]}`}>
                    {STAGE_KO[p.furthest_stage]}까지
                  </span>
                  {p.has_video && <span className="text-xs text-tango-brass/70">▶ 영상</span>}
                  <span className="ml-auto text-xs text-tango-cream/40 tabular-nums">
                    {STAGE_KO[last.stage]} {last.rank}위/{last.of}
                  </span>
                </button>

                {open && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5">
                    {p.name_variants && (
                      <p className="text-xs text-tango-cream/40 mb-2">
                        다른 표기: {p.name_variants.join(' · ')}
                      </p>
                    )}
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-tango-cream/40">
                          <th className="text-left font-normal py-1">스테이지</th>
                          <th className="text-left font-normal py-1">론다</th>
                          <th className="text-right font-normal py-1">순위</th>
                          <th className="text-right font-normal py-1">promedio</th>
                          <th className="text-left font-normal py-1 pl-3">영상</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.stages.map((s, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="py-1.5 text-tango-cream/80">
                              {STAGE_KO[s.stage]}{s.group && ` ${s.group}조`}
                            </td>
                            <td className="py-1.5 text-tango-cream/50">
                              {s.ronda != null ? `${s.ronda}번` : '—'}
                            </td>
                            <td className="py-1.5 text-right tabular-nums text-tango-cream/90">
                              {s.rank}<span className="text-tango-cream/35">/{s.of}</span>
                            </td>
                            <td className="py-1.5 text-right tabular-nums text-tango-cream/70">
                              {s.promedio}
                            </td>
                            <td className="py-1.5 pl-3">
                              {s.videos.length > 0 ? (
                                s.videos.map(v => (
                                  <a
                                    key={v.video_id}
                                    href={`https://www.youtube.com/watch?v=${v.video_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-tango-brass hover:underline mr-2"
                                    title={v.title ?? undefined}
                                  >
                                    ▶ {s.ronda}번 론다
                                  </a>
                                ))
                              ) : (
                                <span className="text-tango-cream/25">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {capped.length === 0 && (
            <p className="text-sm text-tango-cream/40 px-3 py-6">
              「{query}」에 해당하는 등번호나 이름이 없습니다.
            </p>
          )}
        </div>

        <p className="text-xs text-tango-cream/30">{d.note}</p>
      </div>
    </>
  );
}
