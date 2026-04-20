// Mundial 2024 Story — 스크롤 에디토리얼 내러티브 (NYT Snow Fall 스타일)
import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { OrchestraStreamgraph } from '../components/OrchestraStreamgraph';
import { CoupleJourneySankey } from '../components/CoupleJourneySankey';
import { shortOrchestraName } from '../utils/tandaAnalysis';
import songsData from '../data/songs.json';
import appearancesData from '../data/appearances.json';
import roundsData from '../data/competition_rounds.json';
import type { Song, Appearance } from '../types/tango';

const songs = songsData as Song[];
const appearances = appearancesData as Appearance[];
const rounds = (roundsData as any).rounds;
const songMap = new Map(songs.map(s => [s.song_id, s]));

// 연도별 스토리 데이터
const YEAR_STORIES: Record<string, { champion: string; headline: string; angle: string; year: number }> = {
  '2024': {
    year: 2024,
    champion: 'Brenno Lucas Márquez & Fátima Caracoch',
    headline: '10,000명 앞의 Movistar Arena',
    angle: '2024년은 Mundial 사상 처음으로 **Movistar Arena**에서 결승이 열렸다. 10,000명이 넘는 관객 앞에서 펼쳐진 이 대회는 아르헨티나-브라질 커플의 승리로 마무리됐다.',
  },
  '2023': {
    year: 2023,
    champion: 'Suyay Quiroga & Jhonny Carvajal',
    headline: '젊은 세대의 부상',
    angle: '2023년은 세대 교체의 해였다. Suyay Quiroga와 Jhonny Carvajal은 클래식한 해석 대신 **신선한 음악성**으로 심사위원의 마음을 사로잡았다.',
  },
  '2022': {
    year: 2022,
    champion: 'Constanza Vieyto & Ricardo Astrada',
    headline: '팬데믹 후의 귀환',
    angle: '2022년 Mundial은 **대규모 오프라인 복귀**의 해였다. Di Sarli "Indio Manso"로 시작한 결승은 아르헨티나 탱고의 우아함을 상징했다.',
  },
  '2019': {
    year: 2019,
    champion: 'Agustina Piaggio & Maxim Gerasimov',
    headline: '마지막 팬데믹 이전',
    angle: '2019년은 팬데믹 이전 마지막 정상 대회였다. Di Sarli-Tanturi-D\'Arienzo의 클래식 조합이 **4개 라운드 내내 반복**된 의미심장한 해였다.',
  },
};

interface Props { }

export function MundialStoryPage({ }: Props) {
  const params = useParams<{ year: string }>();
  const year = params.year || '2024';
  const story = YEAR_STORIES[year];

  const yearData = useMemo(() => {
    const yearAppearances = appearances.filter(a => a.year === parseInt(year));
    const yearRounds = rounds.filter((r: any) => r.year === parseInt(year) && r.competition === 'Mundial');

    const orchCounts: Record<string, number> = {};
    for (const a of yearAppearances) {
      const song = songMap.get(a.song_id);
      const orch = shortOrchestraName(song?.orchestra || '');
      if (orch === '?') continue;
      orchCounts[orch] = (orchCounts[orch] || 0) + 1;
    }

    const topOrchs = Object.entries(orchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const finalRounds = yearRounds
      .filter((r: any) => r.stage === 'final' && r.songs.length > 0)
      .sort((a: any, b: any) => a.ronda_number - b.ronda_number);

    return {
      totalAppearances: yearAppearances.length,
      totalRounds: yearRounds.length,
      topOrchs,
      finalRounds,
    };
  }, [year]);

  if (!story) {
    return (
      <>
        <PageHeader title="Mundial Story" />
        <div className="flex-1 flex items-center justify-center text-tango-cream/60 font-serif italic">
          {year}년 스토리가 아직 없습니다
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Mundial ${story.year}`} />
      <div className="flex-1 overflow-y-auto bg-tango-ink">

        {/* HERO */}
        <section className="relative bg-gradient-to-br from-tango-burgundy/20 via-tango-shadow to-tango-ink py-20 md:py-32 px-5 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-[10px] tracking-[0.4em] uppercase text-tango-brass font-sans mb-4">
              Feature · Long Read · Vol. 001
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl text-tango-paper italic leading-[0.95] mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              Mundial
              <br />
              <em className="text-tango-brass">{story.year}</em>
            </h1>
            <OrnamentDivider className="my-6" />
            <p className="font-serif text-2xl md:text-3xl text-tango-cream/80 italic leading-snug max-w-2xl mx-auto" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
              {story.headline}
            </p>
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass mt-8 font-sans">
              — {story.champion} —
            </div>
          </div>
        </section>

        {/* BODY 1 — 각도 */}
        <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
          <div className="font-display text-7xl md:text-9xl text-tango-brass/20 italic leading-none float-left mr-4 -mt-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            “
          </div>
          <p className="font-serif text-xl md:text-2xl text-tango-paper leading-relaxed italic" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
            {story.angle.split('**').map((t, i) =>
              i % 2 === 0 ? <span key={i}>{t}</span> : <strong key={i} className="not-italic text-tango-brass font-semibold">{t}</strong>
            )}
          </p>
        </section>

        <OrnamentDivider />

        {/* 통계 */}
        <section className="max-w-4xl mx-auto px-5 md:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-l-2 border-tango-brass/40 pl-4">
              <div className="font-display text-4xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {yearData.totalAppearances}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-2">곡 출현</div>
            </div>
            <div className="border-l-2 border-tango-brass/40 pl-4">
              <div className="font-display text-4xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {yearData.totalRounds}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-2">라운드</div>
            </div>
            <div className="border-l-2 border-tango-brass/40 pl-4">
              <div className="font-display text-4xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {yearData.topOrchs[0]?.[0].split(' ')[0] || '—'}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-2">주류 악단</div>
            </div>
            <div className="border-l-2 border-tango-brass/40 pl-4">
              <div className="font-display text-4xl text-tango-brass font-bold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {yearData.finalRounds.length}
              </div>
              <div className="text-[10px] tracking-widest uppercase text-tango-cream/50 mt-2">결승 Ronda</div>
            </div>
          </div>
        </section>

        {/* 커플 여정 Sankey */}
        <section className="max-w-5xl mx-auto px-5 md:px-8 py-16">
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3 text-center">
            Tournament Flow
          </div>
          <h2 className="font-display text-4xl text-tango-paper italic text-center mb-10" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            예선에서 <em className="text-tango-brass">결승</em>까지
          </h2>
          <CoupleJourneySankey year={String(story.year)} />
        </section>

        {/* 스트림그래프 */}
        <section className="max-w-5xl mx-auto px-5 md:px-8 py-16">
          <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3 text-center">
            Orchestra Flow
          </div>
          <h2 className="font-display text-4xl text-tango-paper italic text-center mb-10" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            이 해를 관통한 <em className="text-tango-brass">음악</em>
          </h2>
          <div className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-4 md:p-6">
            <OrchestraStreamgraph stageFilter="all" />
          </div>
        </section>

        {/* 결승 라운드 깊이 */}
        {yearData.finalRounds.length > 0 && (
          <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3 text-center">
              The Final · 결승의 4개 Ronda
            </div>
            <h2 className="font-display text-4xl text-tango-paper italic text-center mb-10" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              결승에서 흐른 <em className="text-tango-brass">12곡</em>
            </h2>
            <div className="space-y-8">
              {yearData.finalRounds.map((r: any, i: number) => (
                <div key={r.round_id} className="grid grid-cols-[80px_1fr] gap-6">
                  <div className="text-right">
                    <div className="font-display text-6xl text-tango-brass/40 italic leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] tracking-widest uppercase text-tango-cream/50 font-sans mt-2">Ronda</div>
                  </div>
                  <div className="space-y-3 pl-6 border-l border-tango-brass/20">
                    {r.songs.map((s: any) => (
                      <Link
                        key={s.song_id}
                        to={s.song_id ? `/song/${s.song_id}` : '#'}
                        className="block group"
                      >
                        <div className="font-serif italic text-xl text-tango-paper group-hover:text-tango-brass transition-colors" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {s.title}
                        </div>
                        <div className="text-[10px] tracking-wider uppercase text-tango-cream/50 font-sans">
                          {shortOrchestraName(s.orchestra || '')}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 주류 악단 */}
        <section className="max-w-3xl mx-auto px-5 md:px-8 py-16">
          <h2 className="font-display text-3xl text-tango-paper italic text-center mb-8" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            이 해의 <em className="text-tango-brass">악단 TOP 5</em>
          </h2>
          <div className="space-y-2">
            {yearData.topOrchs.map(([orch, count], i) => (
              <div key={orch} className="flex items-center gap-4 py-3 border-b border-tango-brass/15">
                <span className="font-display text-3xl text-tango-brass/60 italic leading-none w-12 flex-shrink-0" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-serif italic text-xl text-tango-paper flex-1" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                  {orch}
                </span>
                <span className="text-tango-brass font-bold">{count}회</span>
              </div>
            ))}
          </div>
        </section>

        {/* 다른 연도 */}
        <section className="max-w-4xl mx-auto px-5 md:px-8 py-16 border-t border-tango-brass/20">
          <div className="text-center mb-8">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Other Issues
            </div>
            <h2 className="font-display text-3xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              다른 해의 <em className="text-tango-brass">Mundial</em>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(YEAR_STORIES).map(([y, s]) => (
              <Link
                key={y}
                to={`/mundial/${y}`}
                className={`block p-4 border rounded-sm text-center transition-all ${
                  y === year
                    ? 'border-tango-brass bg-tango-brass/10'
                    : 'border-tango-brass/20 hover:border-tango-brass/50 hover:bg-tango-shadow/40'
                }`}
              >
                <div className="font-display text-2xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {s.year}
                </div>
                <div className="text-[10px] text-tango-cream/60 mt-1 font-sans">
                  {s.champion.split('&')[0].trim()}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <OrnamentDivider className="py-8" />
        <div className="text-center text-[10px] tracking-[0.3em] uppercase text-tango-cream/30 pb-12 font-sans">
          석정소유의 탱고랩 · Vol. 001
        </div>
      </div>
    </>
  );
}
