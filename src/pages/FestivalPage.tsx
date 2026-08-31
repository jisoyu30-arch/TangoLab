// Tango BA Festival y Mundial 2026 — 일정·공연장 안내
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import festival from '../data/mundial_2026_festival.json';

interface FestivalEvent {
  time: string;
  venue: string;
  category: string;
  category_ko: string | null;
  title: string;
}
interface FestivalDay {
  date: string;
  day: number;
  weekday_es: string;
  weekday_ko: string;
  events: FestivalEvent[];
}
interface Venue {
  name: string;
  address: string;
  neighborhood: string | null;
  comuna: string | null;
  note?: string;
}
interface PolicyGroup {
  venues: string[];
  venues_raw: string;
  policy_es: string;
  policy_en: string;
}
interface CompetitionEvent extends FestivalEvent {
  date: string;
  weekday_ko: string;
}

const data = festival as unknown as {
  festival: { name: string; start: string; end: string; city: string };
  venues: Venue[];
  ticket_policy: PolicyGroup[];
  competition_schedule: CompetitionEvent[];
  days: FestivalDay[];
  source: string;
};

const CATEGORY_STYLE: Record<string, string> = {
  'MUNDIAL DE BAILE': 'bg-tango-brass text-tango-ink font-semibold',
  MILONGA: 'bg-tango-burgundy/40 text-tango-rose border border-tango-rose/30',
  'CLASES DE BAILE': 'bg-white/10 text-tango-cream/80 border border-white/10',
  'LA USINA MILONGUERA': 'bg-tango-copper/25 text-tango-cream border border-tango-copper/40',
  DANZA: 'bg-white/10 text-tango-cream/80 border border-white/10',
};
const catStyle = (c: string) =>
  CATEGORY_STYLE[c] ?? 'bg-white/5 text-tango-cream/60 border border-white/10';

/** 대회 종목 — 제목에 Pista / Escenario 중 무엇이 들어있는지 */
const disciplineOf = (title: string) =>
  /escenario/i.test(title) ? 'escenario' : /pista/i.test(title) ? 'pista' : null;

const fmtDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
};

function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function FestivalPage() {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data.days.find(d => d.date >= today)?.date ?? data.days[0].date;
  });
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showVenues, setShowVenues] = useState(false);

  const day = useMemo(
    () => data.days.find(d => d.date === selectedDate) ?? data.days[0],
    [selectedDate]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, { ko: string | null; n: number }>();
    for (const e of day.events) {
      const cur = counts.get(e.category);
      counts.set(e.category, { ko: e.category_ko, n: (cur?.n ?? 0) + 1 });
    }
    return [...counts.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [day]);

  const events = useMemo(
    () => (categoryFilter ? day.events.filter(e => e.category === categoryFilter) : day.events),
    [day, categoryFilter]
  );

  /** 이벤트의 장소 문자열에서 공연장을 찾아 주소를 붙인다 ("Usina del Arte, Salón Mayor" → Usina del Arte) */
  const addressFor = (venue: string) => {
    const hit = data.venues.find(v => venue.toLowerCase().startsWith(v.name.toLowerCase()));
    return hit ? `${hit.address}${hit.neighborhood ? ` · ${hit.neighborhood}` : ''}` : null;
  };

  const finals = data.competition_schedule.filter(c => /final de tango/i.test(c.title));

  return (
    <>
      <PageHeader title="축제 · 대회 일정" />
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-6">
        {/* 개요 */}
        <section className="bg-white/5 border border-tango-brass/20 rounded-xl p-4 md:p-5">
          <h1 className="text-lg md:text-xl font-bold text-white">{data.festival.name}</h1>
          <p className="text-tango-brass text-sm mt-0.5">
            {fmtDate(data.festival.start)} – {fmtDate(data.festival.end)} · {data.festival.city}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {finals.map(f => {
              const d = daysUntil(f.date);
              return (
                <div key={f.title} className="px-3 py-2 rounded-lg bg-tango-brass/15 border border-tango-brass/30">
                  <div className="text-xs text-tango-cream/60">{f.title}</div>
                  <div className="text-sm text-tango-brass font-semibold">
                    {fmtDate(f.date)} ({f.weekday_ko}) {f.time} · {f.venue}
                  </div>
                  <div className="text-xs text-tango-cream/50 mt-0.5">
                    {d > 0 ? `D-${d}` : d === 0 ? '오늘' : `${-d}일 전 종료`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 대회 일정 */}
        <section>
          <h2 className="text-sm font-semibold text-tango-brass mb-2 tracking-wide">
            세계선수권 일정 ({data.competition_schedule.length}건)
          </h2>
          <div className="space-y-1.5">
            {data.competition_schedule.map(c => {
              const disc = disciplineOf(c.title);
              const past = daysUntil(c.date) < 0;
              return (
                <button
                  key={`${c.date}-${c.title}`}
                  onClick={() => { setSelectedDate(c.date); setCategoryFilter(null); }}
                  className={`w-full text-left flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2 rounded-lg transition-colors ${
                    past ? 'bg-white/5 hover:bg-white/10' : 'bg-tango-brass/10 hover:bg-tango-brass/20 border border-tango-brass/25'
                  }`}
                >
                  <span className="text-xs text-tango-cream/50 w-24 shrink-0">
                    {fmtDate(c.date)} ({c.weekday_ko})
                  </span>
                  <span className="text-sm text-tango-brass font-medium w-14 shrink-0">{c.time}</span>
                  <span className={`text-sm ${past ? 'text-tango-cream/70' : 'text-white font-medium'}`}>
                    {c.title}
                  </span>
                  {disc && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                      disc === 'pista' ? 'bg-tango-brass/25 text-tango-brass' : 'bg-white/10 text-tango-cream/60'
                    }`}>
                      {disc === 'pista' ? '피스타' : '에스체나리오'}
                    </span>
                  )}
                  <span className="text-xs text-tango-cream/40 ml-auto">{c.venue}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 날짜별 프로그램 */}
        <section>
          <h2 className="text-sm font-semibold text-tango-brass mb-2 tracking-wide">날짜별 프로그램</h2>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {data.days.map(d => {
              const hasComp = d.events.some(e => e.category === 'MUNDIAL DE BAILE');
              return (
                <button
                  key={d.date}
                  onClick={() => { setSelectedDate(d.date); setCategoryFilter(null); }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    d.date === selectedDate
                      ? 'bg-white/20 text-white font-medium'
                      : 'bg-white/5 text-tango-cream/60 hover:bg-white/10'
                  }`}
                  title={`${d.events.length}개 프로그램`}
                >
                  {Number(d.date.slice(5, 7))}/{Number(d.date.slice(8))} ({d.weekday_ko})
                  {hasComp && <span className="ml-1 text-tango-brass">◆</span>}
                </button>
              );
            })}
          </div>

          <div className="flex gap-1.5 flex-wrap mb-3">
            <button
              onClick={() => setCategoryFilter(null)}
              className={`px-2.5 py-1 rounded text-xs ${
                categoryFilter === null ? 'bg-tango-brass/25 text-tango-brass' : 'bg-white/5 text-tango-cream/50 hover:bg-white/10'
              }`}
            >
              전체 {day.events.length}
            </button>
            {categories.map(([cat, info]) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                className={`px-2.5 py-1 rounded text-xs ${
                  categoryFilter === cat ? 'bg-tango-brass/25 text-tango-brass' : 'bg-white/5 text-tango-cream/50 hover:bg-white/10'
                }`}
              >
                {info.ko ?? cat} {info.n}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            {events.map((e, i) => {
              const addr = addressFor(e.venue);
              return (
                <div
                  key={`${e.time}-${e.title}-${i}`}
                  className={`flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3 px-3 py-2 rounded-lg ${
                    e.category === 'MUNDIAL DE BAILE' ? 'bg-tango-brass/10 border border-tango-brass/25' : 'bg-white/5'
                  }`}
                >
                  <span className="text-sm text-tango-brass font-medium w-24 shrink-0">{e.time}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white">{e.title}</div>
                    <div className="text-xs text-tango-cream/50">
                      {e.venue}
                      {addr && <span className="text-tango-cream/30"> · {addr}</span>}
                    </div>
                  </div>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded self-start shrink-0 ${catStyle(e.category)}`}>
                    {e.category_ko ?? e.category}
                  </span>
                </div>
              );
            })}
            {events.length === 0 && (
              <p className="text-sm text-tango-cream/40 px-3 py-4">이 날짜에는 등록된 프로그램이 없습니다.</p>
            )}
          </div>
        </section>

        {/* 공연장 */}
        <section>
          <button
            onClick={() => setShowVenues(v => !v)}
            className="text-sm font-semibold text-tango-brass mb-2 tracking-wide flex items-center gap-1.5"
          >
            공연장 {data.venues.length}곳 · 입장 정책
            <span className="text-xs">{showVenues ? '▲' : '▼'}</span>
          </button>

          {showVenues && (
            <div className="space-y-4">
              <div className="grid gap-1.5 md:grid-cols-2">
                {data.venues.map(v => (
                  <div key={v.name} className="px-3 py-2 rounded-lg bg-white/5">
                    <div className="text-sm text-white">{v.name}</div>
                    <div className="text-xs text-tango-cream/50">
                      {v.address}
                      {v.neighborhood && ` · ${v.neighborhood}`}
                      {v.comuna && ` · ${v.comuna}`}
                    </div>
                    {v.note && <div className="text-xs text-tango-cream/35 mt-0.5">{v.note}</div>}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-tango-brass/80 tracking-wide">입장 정책</h3>
                {data.ticket_policy.map((g, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg bg-white/5">
                    <div className="text-xs text-tango-brass mb-1">
                      {g.venues.length > 0 ? g.venues.join(' · ') : g.venues_raw}
                    </div>
                    <p className="text-xs text-tango-cream/60 leading-relaxed">{g.policy_es}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <p className="text-xs text-tango-cream/30">출처: {data.source}</p>
      </div>
    </>
  );
}
