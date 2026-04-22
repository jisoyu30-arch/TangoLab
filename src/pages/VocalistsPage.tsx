// 보컬리스트 전략 분석 — 대회에서 이 보컬리스트 곡이 어떻게 쓰이나
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { OrnamentDivider } from '../components/editorial';
import { TrendInsight } from '../components/TrendInsight';
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
  orchestras: Map<string, number>;
  years: number[];
}

// 주요 보컬리스트 전략적 특징 (핸드 큐레이션)
const VOCALIST_PROFILES: Record<string, { mood: string; tempo: string; strategy: string }> = {
  'Alberto Echagüe': {
    mood: '리드미컬 · 남성적 · 스타카토',
    tempo: '빠른 템포 (D\'Arienzo와 함께)',
    strategy: '댄스 에너지 고조에 적합. 대회 결승 3번째 곡(클라이맥스)에 자주 배치.',
  },
  'Alberto Castillo': {
    mood: '극적 · 연극적 · 격정',
    tempo: '다양 (Tanturi 시절)',
    strategy: '드라마를 원하는 순간. 감정 표현력 시험용.',
  },
  'Roberto Rufino': {
    mood: '젊은 낭만 · 서정',
    tempo: '중간 (Di Sarli와 함께)',
    strategy: '우아한 카미나타 강조. 결승 첫 곡(안착)에 자주 배치.',
  },
  'Raúl Berón': {
    mood: '깊고 절제 · 바리톤',
    tempo: '중간 (Caló와 함께)',
    strategy: '성숙한 해석. 탱고 살롱 스타일 요구되는 라운드.',
  },
  'Jorge Durán': {
    mood: '달콤하고 섬세',
    tempo: '중간 (Di Sarli 후기)',
    strategy: '우아한 프레이징. 파트너와의 일체감 강조.',
  },
  'Enrique Campos': {
    mood: '따뜻하고 인간적',
    tempo: '중간',
    strategy: '감정의 흐름이 자연스러운 카미나타.',
  },
  'Ángel Vargas': {
    mood: '고전적 · 정통',
    tempo: '중간 (D\'Agostino와 함께)',
    strategy: '탱고 살롱의 정수. 기본기 시험용.',
  },
  'Jorge Maciel': {
    mood: '드라마틱 · 풍부한 감정',
    tempo: '느림~중간 (Pugliese 후기)',
    strategy: '정적과 격정의 대비. 극한 표현 요구.',
  },
  'Alberto Podestá': {
    mood: '청년의 순수 · 낭만',
    tempo: '중간',
    strategy: '젊은 에너지. 발랄함 필요한 순간.',
  },
  'Francisco Fiorentino': {
    mood: '클래식 · 전설적',
    tempo: '중간 (Troilo 초기)',
    strategy: '탱고의 기원을 느끼게 함. 전통적 해석.',
  },
  'Floreal Ruiz': {
    mood: '세련 · 신사적',
    tempo: '중간',
    strategy: '절제된 감정. 댄스의 우아함 강조.',
  },
  'Alberto Morán': {
    mood: '격정 · 극한 · 비극',
    tempo: '느림~중간 (Pugliese와 함께)',
    strategy: '강렬한 드라마. 상급자용 해석 과제.',
  },
};

export function VocalistsPage() {
  const [selectedName, setSelectedName] = useState<string | null>(null);

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
          orchestras: new Map(),
          years: [],
        });
      }
      const v = map.get(name)!;
      v.songs.push(song);
      if (song.orchestra) {
        const oKey = song.orchestra.split(' ')[0];
        v.orchestras.set(oKey, (v.orchestras.get(oKey) || 0) + 1);
      }
    }

    for (const a of appearances) {
      const song = songMap.get(a.song_id);
      if (!song?.vocalist) continue;
      const v = map.get(song.vocalist.trim());
      if (!v) continue;
      v.totalApp++;
      if (a.stage === 'final') v.finalCount++;
      v.years.push(a.year);
    }

    return Array.from(map.values())
      .filter(v => v.totalApp >= 2)
      .sort((a, b) => b.finalCount * 3 + b.totalApp - (a.finalCount * 3 + a.totalApp));
  }, []);

  const selected = vocalists.find(v => v.name === selectedName);
  const selectedProfile = selected && VOCALIST_PROFILES[selected.name];

  return (
    <>
      <PageHeader title="보컬리스트" />
      <div className="flex-1 overflow-y-auto bg-tango-ink">
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 space-y-8">

          <div className="text-center">
            <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
              Voices · Strategic Analysis
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-tango-paper italic" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              보컬의 <em className="text-tango-brass">해석</em>과 전략
            </h1>
            <p className="text-sm text-tango-cream/60 mt-3 font-serif italic max-w-xl mx-auto">
              각 보컬리스트의 무드·템포 특징과 대회 활용 전략
            </p>
            <OrnamentDivider className="mt-6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* 목록 */}
            <div>
              <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-3">
                TOP 보컬리스트 (결승 가중 정렬)
              </div>
              <div className="space-y-px bg-tango-brass/15 rounded-sm overflow-hidden">
                {vocalists.slice(0, 20).map((v, i) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedName(selectedName === v.name ? null : v.name)}
                    className={`w-full text-left bg-tango-ink hover:bg-tango-shadow p-3 transition-all ${
                      selected?.name === v.name ? 'bg-tango-brass/10' : ''
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="text-tango-brass/50 text-xs font-sans w-5 flex-shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-serif italic text-base text-tango-paper truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {v.name}
                        </div>
                        <div className="text-[10px] text-tango-cream/50 font-sans mt-0.5">
                          총 {v.totalApp}회 · 결승 {v.finalCount}회 · 악단 {v.orchestras.size}개
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 상세 */}
            <div>
              {!selected ? (
                <div className="bg-tango-shadow/40 border border-tango-brass/15 rounded-sm p-12 text-center">
                  <div className="font-display italic text-2xl text-tango-cream/50" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                    보컬리스트를 선택하세요
                  </div>
                  <p className="text-sm text-tango-cream/40 mt-2 font-serif italic">왼쪽에서 이름을 클릭하면 전략 분석이 열립니다</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 이름 헤더 */}
                  <div className="border-b border-tango-brass/20 pb-4">
                    <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass font-sans mb-2">
                      Voice Profile
                    </div>
                    <h2 className="font-display text-3xl md:text-5xl text-tango-paper italic leading-none" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                      {selected.name}
                    </h2>
                    <div className="flex items-center gap-4 mt-3 text-xs font-sans">
                      <span className="text-tango-brass">총 {selected.totalApp}회 출현</span>
                      <span className="text-tango-rose">결승 {selected.finalCount}회</span>
                      {selected.years.length > 0 && (
                        <span className="text-tango-cream/50">
                          {Math.min(...selected.years)}–{Math.max(...selected.years)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 큐레이션 프로필 */}
                  {selectedProfile ? (
                    <div className="bg-tango-shadow/40 border border-tango-brass/20 rounded-sm p-5 space-y-3">
                      <div>
                        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass mb-1 font-sans">무드</div>
                        <p className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {selectedProfile.mood}
                        </p>
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass mb-1 font-sans">템포</div>
                        <p className="font-serif italic text-base text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {selectedProfile.tempo}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-tango-brass/15">
                        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-rose mb-1 font-sans">🎯 대회 전략</div>
                        <p className="font-serif italic text-base text-tango-paper leading-relaxed" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                          {selectedProfile.strategy}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <TrendInsight
                      context={`보컬리스트: ${selected.name}. 총 대회 출현: ${selected.totalApp}회, 결승: ${selected.finalCount}회. 주로 함께한 악단: ${Array.from(selected.orchestras.entries()).slice(0, 3).map(([o, c]) => `${o}(${c}곡)`).join(', ')}. 대표 곡: ${selected.songs.slice(0, 5).map(s => s.title).join(', ')}.`}
                      cacheKey={`vocalist-${selected.name}`}
                      title={`${selected.name} 전략 분석`}
                    />
                  )}

                  {/* 함께한 악단 */}
                  <div>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass mb-3 font-sans">
                      주로 함께한 악단
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(selected.orchestras.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([o, c]) => (
                          <span key={o} className="inline-flex items-center gap-2 px-3 py-1.5 bg-tango-brass/5 border border-tango-brass/20 rounded-sm text-sm">
                            <span className="font-serif italic text-tango-paper" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>{o}</span>
                            <span className="text-[10px] text-tango-brass font-sans">{c}곡</span>
                          </span>
                        ))}
                    </div>
                  </div>

                  {/* 대표 곡 */}
                  <div>
                    <div className="text-[10px] tracking-[0.3em] uppercase text-tango-brass mb-3 font-sans">
                      대표 곡 ({selected.songs.length}개)
                    </div>
                    <div className="space-y-1">
                      {selected.songs.slice(0, 12).map(s => (
                        <Link
                          key={s.song_id}
                          to={`/song/${s.song_id}`}
                          className="flex items-baseline justify-between gap-3 py-2 border-b border-tango-brass/10 hover:bg-tango-brass/5 px-2 -mx-2 transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-serif italic text-base text-tango-paper group-hover:text-tango-brass transition-colors truncate" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                              {s.title}
                            </span>
                            <span className="text-[11px] tracking-wider uppercase text-tango-cream/50 ml-3 font-sans">
                              {s.orchestra?.split(' ')[0]}
                            </span>
                          </div>
                          {s.recording_date && (
                            <span className="text-[10px] text-tango-cream/40 font-sans flex-shrink-0">
                              {s.recording_date}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <OrnamentDivider className="pt-8" />
        </div>
      </div>
    </>
  );
}
