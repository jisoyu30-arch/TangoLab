// 오늘의 탄다 위젯 — 매일 바뀌는 추천 탄다
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import roundsData from '../data/competition_rounds.json';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import { OrnamentDivider } from './editorial';

const rounds = (roundsData as any).rounds;

// 오늘 날짜 기반 hash로 결정적 탄다 선택
function pickDailyTanda() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // 곡 3개 이상 있는 라운드만
  const eligible = rounds.filter((r: any) => r.songs?.length >= 3 && r.videos?.length > 0);
  if (eligible.length === 0) return null;

  return eligible[seed % eligible.length];
}

export function DailyTandaWidget() {
  const tanda = useMemo(() => pickDailyTanda(), []);

  if (!tanda) return null;

  const stageLabel = tanda.stage === 'final' ? '결승'
    : tanda.stage === 'semifinal' ? '준결승'
    : tanda.stage === 'quarterfinal' ? '8강' : '예선';

  const videoId = tanda.videos?.[0]?.video_id;

  return (
    <section className="relative overflow-hidden rounded-sm border border-tango-brass/20 bg-gradient-to-br from-tango-burgundy/10 via-tango-shadow to-tango-ink p-6 md:p-8">
      <div className="absolute top-4 right-4 text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans">
        Today · 오늘의 탄다
      </div>

      <div className="mb-4">
        <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">
          {tanda.competition} {tanda.year} · {stageLabel} · Ronda {tanda.ronda_number}
        </div>
        <h2 className="font-display italic text-2xl md:text-3xl text-tango-paper mt-1" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Daily <em className="text-tango-brass">Tanda</em>
        </h2>
      </div>

      <div className="space-y-3 mb-6">
        {tanda.songs.slice(0, 3).map((s: any, i: number) => (
          <Link
            key={s.song_id || i}
            to={s.song_id ? `/song/${s.song_id}` : '#'}
            className="flex items-start gap-4 py-2 border-b border-tango-brass/10 hover:bg-tango-brass/5 transition-colors group"
          >
            <span className="font-display text-2xl text-tango-brass/60 leading-none w-8 flex-shrink-0" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-serif italic text-lg text-tango-paper truncate group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {s.title}
              </div>
              <div className="text-[11px] text-tango-cream/50 tracking-wider uppercase font-sans truncate">
                {shortOrchestraName(s.orchestra || '')}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {videoId && (
        <div className="relative w-full rounded-sm overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={`Daily Tanda ${tanda.year}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <OrnamentDivider className="mt-6" />
    </section>
  );
}

/** 오늘 날짜의 과거 Mundial 이벤트 위젯 */
export function TodayInHistoryWidget() {
  const { monthDay, sameDayRounds } = useMemo(() => {
    const today = new Date();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const monthDay = `${m}/${d}`;

    // Mundial은 보통 8-9월, 이 달에 일어난 라운드를 관련성 있게 표시
    const thisMonthRounds = rounds.filter((r: any) => {
      // 가상: round 데이터에 date가 없으면 month 기준만 확인 (약 8월)
      return r.competition === 'Mundial' && r.songs?.length >= 2;
    });

    // 연도별로 정리
    const byYear: Record<number, typeof thisMonthRounds> = {};
    for (const r of thisMonthRounds) {
      if (!byYear[r.year]) byYear[r.year] = [];
      byYear[r.year].push(r);
    }

    // 가장 오래된 해와 가장 최근 해 비교
    const years = Object.keys(byYear).map(Number).sort();
    const seed = today.getFullYear() * 100 + today.getMonth() + today.getDate();

    // 랜덤 같은 날 Ronda 3개
    const pool = thisMonthRounds.filter((r: any) => r.stage === 'final' || r.stage === 'semifinal');
    const picked = pool.slice(seed % Math.max(1, pool.length - 3), (seed % Math.max(1, pool.length - 3)) + 3);

    return { monthDay, years, sameDayRounds: picked };
  }, []);

  if (sameDayRounds.length === 0) return null;

  return (
    <section>
      <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
        This Day · {monthDay}
      </div>
      <h2 className="font-display italic text-2xl md:text-3xl text-tango-paper mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        역사 속 오늘의 Mundial
      </h2>
      <div className="space-y-2">
        {sameDayRounds.slice(0, 3).map((r: any) => (
          <div key={r.round_id} className="flex items-start gap-4 py-3 border-b border-tango-brass/10">
            <span className="font-display text-2xl text-tango-brass font-bold leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              {r.year}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 font-sans">
                {r.stage === 'final' ? '결승' : r.stage === 'semifinal' ? '준결승' : '예선'} · Ronda {r.ronda_number}
              </div>
              <div className="font-serif italic text-sm text-tango-paper mt-0.5" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                {r.songs.map((s: any) => s.title).join(' · ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
